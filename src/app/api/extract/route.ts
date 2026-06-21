import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import mammoth from 'mammoth';
import dns from 'node:dns/promises';
import net from 'node:net';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/apiAuth';
import { mirrorExtractionLog } from '@/lib/firebase';
import { geocodeAddress } from '@/lib/geocode';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `You are an offer extraction specialist. Extract ALL offers, deals, discounts, and promotions from the provided content. The content may be plain text, a PDF/DOCX dump, or a webpage where most ads appear inside the attached poster images — read text out of every image attached. Each distinct poster, ad, or promotion is a separate item; do not merge them.

Return ONLY a raw JSON array with no markdown fences, no explanation. Each item must have exactly these fields:
{"title":"offer title","merchant":"brand/merchant name","discount":"e.g. 30% off or BOGO or Free item","description":"brief description under 100 chars","validUntil":"YYYY-MM-DD or empty string","category":"Food & Dining|Fashion|Electronics|Travel|Beauty|Health|Entertainment|Shopping","address":"full shop address as printed, including landmark and pincode","area":"neighbourhood / locality only (e.g. Velachery, T. Nagar)","city":"city name (e.g. Chennai, Salem)","latitude":number_or_empty_string,"longitude":number_or_empty_string}

Newspaper and poster ads almost always print the shop address right under the offer ("Next to SBI, 100ft road, Velachery — 600042"). ALWAYS try to extract address / area / city. Only fill latitude/longitude if the source explicitly prints coordinates — do not guess.

If a field is unknown use empty string. Never return an empty array without trying hard. Skip generic navigation, follow-us prompts, and the site's own branding — only real merchant offers.`;

function parseOffers(raw: string): any[] {
  let text = raw.trim();
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  const start = text.indexOf('[');
  if (start >= 0) {
    let depth = 0;
    for (let i = start; i < text.length; i++) {
      if (text[i] === '[') depth++;
      else if (text[i] === ']') {
        depth--;
        if (depth === 0) {
          const slice = text.slice(start, i + 1);
          try {
            const parsed = JSON.parse(slice);
            if (Array.isArray(parsed)) return parsed;
          } catch {}
          break;
        }
      }
    }
  }
  return [];
}

async function readFormFile(req: NextRequest): Promise<{ sourceType: string; content: string; file?: { name: string; buffer: Buffer; type: string } }> {
  const form = await req.formData();
  const sourceType = String(form.get('sourceType') || '');
  const content = String(form.get('content') || '');
  const file = form.get('file');
  if (file && typeof file !== 'string') {
    const f = file as File;
    const arrayBuffer = await f.arrayBuffer();
    return {
      sourceType,
      content,
      file: { name: f.name, buffer: Buffer.from(arrayBuffer), type: f.type },
    };
  }
  return { sourceType, content };
}

function guessImageMime(name: string): string {
  const ext = name.toLowerCase().split('.').pop();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    default:
      return '';
  }
}

// ---- SSRF guard -----------------------------------------------------------
// Any URL passed to fetch() in this route flows through assertPublicUrl(), so
// the admin-gated input can't make us hit loopback / RFC1918 / link-local /
// cloud-metadata addresses, and redirects are followed manually with the same
// check on every hop.

const PRIVATE_V4: Array<[string, number]> = [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16], // includes 169.254.169.254 metadata
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
];

function v4ToInt(ip: string): number {
  return ip.split('.').reduce((acc, oct) => (acc << 8) + Number(oct), 0) >>> 0;
}

function isPrivateV4(ip: string): boolean {
  const ipInt = v4ToInt(ip);
  return PRIVATE_V4.some(([base, bits]) => {
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (ipInt & mask) === (v4ToInt(base) & mask);
  });
}

function isPrivateV6(ip: string): boolean {
  const lc = ip.toLowerCase();
  if (lc === '::1' || lc === '::') return true;
  if (lc.startsWith('fe80:') || lc.startsWith('fc') || lc.startsWith('fd')) return true;
  // ::ffff:a.b.c.d — IPv4-mapped
  const mapped = lc.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateV4(mapped[1]);
  return false;
}

function isPrivateAddress(addr: string): boolean {
  if (net.isIPv4(addr)) return isPrivateV4(addr);
  if (net.isIPv6(addr)) return isPrivateV6(addr);
  return true; // unknown family — treat as unsafe
}

async function assertPublicUrl(raw: string): Promise<URL> {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new Error('Invalid URL');
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw new Error('Only http(s) URLs are allowed');
  }
  const host = u.hostname;
  // Reject literal IP hosts that are already private without DNS round-trip.
  if (net.isIP(host) && isPrivateAddress(host)) {
    throw new Error('Refusing to fetch private/loopback address');
  }
  const records = await dns.lookup(host, { all: true });
  if (records.length === 0) throw new Error('DNS lookup failed');
  for (const r of records) {
    if (isPrivateAddress(r.address)) {
      throw new Error('Refusing to fetch host that resolves to a private address');
    }
  }
  return u;
}

async function safeFetch(rawUrl: string, init: RequestInit & { maxBytes?: number } = {}): Promise<{ status: number; headers: Headers; body: Buffer | null }> {
  const MAX_HOPS = 4;
  let nextUrl = rawUrl;
  for (let hop = 0; hop < MAX_HOPS; hop++) {
    const u = await assertPublicUrl(nextUrl);
    const res = await fetch(u, {
      ...init,
      redirect: 'manual',
      headers: {
        'User-Agent': 'Mozilla/5.0 (KootuExtractor)',
        ...(init.headers as Record<string, string> | undefined),
      },
    });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location');
      if (!loc) return { status: res.status, headers: res.headers, body: null };
      nextUrl = new URL(loc, u).toString();
      continue;
    }
    // Body read with running byte cap (cheaper than buffering 100MB only to discard).
    const cap = init.maxBytes ?? 5 * 1024 * 1024;
    const declared = Number(res.headers.get('content-length') || 0);
    if (declared && declared > cap) {
      // Don't even read it.
      return { status: res.status, headers: res.headers, body: null };
    }
    const reader = res.body?.getReader();
    if (!reader) return { status: res.status, headers: res.headers, body: Buffer.alloc(0) };
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > cap) {
        try { await reader.cancel(); } catch {}
        return { status: res.status, headers: res.headers, body: null };
      }
      chunks.push(value);
    }
    return { status: res.status, headers: res.headers, body: Buffer.concat(chunks) };
  }
  throw new Error('Too many redirects');
}

// ---- Page + image fetch ---------------------------------------------------

const PAGE_MAX_BYTES = 4 * 1024 * 1024;
const IMAGE_FETCH_LIMIT = 10;
const IMAGE_CANDIDATE_LIMIT = IMAGE_FETCH_LIMIT * 3;
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const IMAGE_MIN_BYTES = 8 * 1024;
const PAGE_TIMEOUT_MS = 15_000;
const IMAGE_TIMEOUT_MS = 10_000;

async function fetchUrlAsText(url: string): Promise<{ text: string; html: string }> {
  const res = await safeFetch(url, {
    signal: AbortSignal.timeout(PAGE_TIMEOUT_MS),
    maxBytes: PAGE_MAX_BYTES,
  });
  if (res.status < 200 || res.status >= 300 || !res.body) {
    throw new Error(`Failed to fetch URL (HTTP ${res.status})`);
  }
  const html = res.body.toString('utf8');
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 50_000);
  return { text, html };
}

function shouldSkipImageUrl(src: string): boolean {
  if (!src || src.startsWith('data:')) return true;
  if (/\.(svg)(\?|$)/i.test(src)) return true;
  if (/(?:^|\/)(icon|logo|favicon|sprite|avatar|emoji)/i.test(src)) return true;
  return false;
}

function parseSrcsetUrls(value: string): string[] {
  // srcset is a comma-separated list of "url descriptor" entries; descriptors
  // are optional and themselves may contain spaces in funky CDN cases, so we
  // grab whitespace-leading tokens off each comma slice.
  const out: string[] = [];
  for (const entry of value.split(',')) {
    const trimmed = entry.trim();
    if (!trimmed) continue;
    const url = trimmed.split(/\s+/)[0];
    if (url) out.push(url);
  }
  return out;
}

function extractImageUrls(html: string, pageUrl: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (raw: string) => {
    const src = raw.trim();
    if (shouldSkipImageUrl(src)) return;
    let abs: string;
    try {
      abs = new URL(src, pageUrl).toString();
    } catch {
      return;
    }
    if (seen.has(abs)) return;
    seen.add(abs);
    out.push(abs);
  };

  // <img ...> attrs: src, data-src, srcset, data-srcset
  const imgRe = /<img\b([^>]*)>/gi;
  let m: RegExpExecArray | null;
  while ((m = imgRe.exec(html)) !== null && out.length < IMAGE_CANDIDATE_LIMIT) {
    const attrs = m[1];
    const srcAttr = /\b(?:data-)?src\s*=\s*["']([^"']+)["']/i.exec(attrs);
    if (srcAttr) push(srcAttr[1]);
    const srcsetAttr = /\b(?:data-)?srcset\s*=\s*["']([^"']+)["']/i.exec(attrs);
    if (srcsetAttr) for (const u of parseSrcsetUrls(srcsetAttr[1])) push(u);
  }

  // <source srcset="..."> inside <picture>
  const sourceRe = /<source\b[^>]*\bsrcset\s*=\s*["']([^"']+)["'][^>]*>/gi;
  while ((m = sourceRe.exec(html)) !== null && out.length < IMAGE_CANDIDATE_LIMIT) {
    for (const u of parseSrcsetUrls(m[1])) push(u);
  }

  return out.slice(0, IMAGE_CANDIDATE_LIMIT);
}

async function fetchImage(
  url: string
): Promise<{ data: string; mimeType: string } | null> {
  try {
    const res = await safeFetch(url, {
      signal: AbortSignal.timeout(IMAGE_TIMEOUT_MS),
      maxBytes: IMAGE_MAX_BYTES,
    });
    if (res.status < 200 || res.status >= 300 || !res.body) return null;
    const ct = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!ct.startsWith('image/') || ct === 'image/svg+xml') return null;
    if (res.body.byteLength < IMAGE_MIN_BYTES) return null;
    return { data: res.body.toString('base64'), mimeType: ct };
  } catch {
    return null;
  }
}

async function fetchPageImages(
  imageUrls: string[]
): Promise<Array<{ inlineData: { data: string; mimeType: string } }>> {
  // Sequential walk so we stop the moment we have IMAGE_FETCH_LIMIT valid
  // images instead of speculatively pulling 30 and dropping 20.
  const out: Array<{ inlineData: { data: string; mimeType: string } }> = [];
  for (const url of imageUrls) {
    if (out.length >= IMAGE_FETCH_LIMIT) break;
    const img = await fetchImage(url);
    if (img) out.push({ inlineData: img });
  }
  return out;
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAuth(req);
  if (unauthorized) return unauthorized;

  try {
    const { sourceType, content, file } = await readFormFile(req);

    if (!['url', 'text', 'pdf', 'docx', 'image'].includes(sourceType)) {
      return NextResponse.json({ error: 'Invalid sourceType' }, { status: 400 });
    }

    let userMessage = '';
    let sourceRef: string | null = null;
    let imagePart: { inlineData: { data: string; mimeType: string } } | null = null;
    let pageImageParts: Array<{ inlineData: { data: string; mimeType: string } }> = [];

    if (sourceType === 'text') {
      if (!content.trim()) return NextResponse.json({ error: 'No content provided' }, { status: 400 });
      userMessage = content;
    } else if (sourceType === 'url') {
      if (!content.trim()) return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
      sourceRef = content;
      const { text: pageText, html } = await fetchUrlAsText(content);
      const imgUrls = extractImageUrls(html, content);
      pageImageParts = await fetchPageImages(imgUrls);
      if (!pageText && pageImageParts.length === 0) {
        return NextResponse.json(
          { error: 'Fetched page had no readable text or images' },
          { status: 400 }
        );
      }
      userMessage =
        `Source URL: ${content}\n\n` +
        (pageImageParts.length > 0
          ? `The page contains ${pageImageParts.length} attached poster image(s). Read offer text from BOTH the page text and the images. Many offers on sites like this only appear inside the images.\n\n`
          : '') +
        `Page text:\n${pageText}`;
    } else if (sourceType === 'pdf') {
      if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
      sourceRef = file.name;
      const pdfParse = (await import('pdf-parse')).default;
      const parsed = await pdfParse(file.buffer);
      userMessage = parsed.text;
    } else if (sourceType === 'docx') {
      if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
      sourceRef = file.name;
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      userMessage = result.value;
    } else if (sourceType === 'image') {
      if (!file) return NextResponse.json({ error: 'No image uploaded' }, { status: 400 });
      sourceRef = file.name;
      const mimeType = file.type || guessImageMime(file.name);
      if (!mimeType.startsWith('image/')) {
        return NextResponse.json({ error: 'Uploaded file is not an image' }, { status: 400 });
      }
      imagePart = { inlineData: { data: file.buffer.toString('base64'), mimeType } };
      userMessage = 'Extract every offer, deal, discount, or promotion shown in this image.';
    }

    if (!userMessage.trim() && !imagePart) {
      return NextResponse.json({ error: 'No extractable content found' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const parts: any[] = [];
    if (imagePart) parts.push(imagePart);
    for (const p of pageImageParts) parts.push(p);
    if (userMessage) parts.push({ text: userMessage });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts }],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        maxOutputTokens: 4000,
      },
    });

    const raw = response.text ?? '';
    const offers = parseOffers(raw);

    // Best-effort geocode: only addresses without coords.
    for (const o of offers) {
      const hasCoords =
        typeof o.latitude === 'number' && typeof o.longitude === 'number';
      if (hasCoords) continue;
      const addr = [o.address, o.area, o.city].filter(Boolean).join(', ');
      if (!addr) continue;
      const geo = await geocodeAddress(addr);
      if (geo) {
        o.latitude = geo.lat;
        o.longitude = geo.lng;
      }
    }

    const log = await prisma.extractionLog.create({
      data: {
        sourceType,
        sourceRef,
        offersFound: offers.length,
      },
    });
    await mirrorExtractionLog(log);

    return NextResponse.json({ offers, count: offers.length });
  } catch (err: any) {
    console.error('Extract error:', err);
    return NextResponse.json({ error: err?.message || 'Extraction failed' }, { status: 500 });
  }
}
