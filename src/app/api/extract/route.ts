import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import mammoth from 'mammoth';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/apiAuth';
import { mirrorExtractionLog } from '@/lib/firebase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `You are an offer extraction specialist. Extract ALL offers, deals, discounts, and promotions from the provided content. The content may be plain text, a PDF/DOCX dump, or a webpage where most ads appear inside the attached poster images — read text out of every image attached. Each distinct poster, ad, or promotion is a separate item; do not merge them.

Return ONLY a raw JSON array with no markdown fences, no explanation. Each item must have exactly these fields:
{"title":"offer title","merchant":"brand/merchant name","discount":"e.g. 30% off or BOGO or Free item","description":"brief description under 100 chars","validUntil":"YYYY-MM-DD or empty string","category":"Food & Dining|Fashion|Electronics|Travel|Beauty|Health|Entertainment|Shopping"}

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

async function fetchUrlAsText(url: string): Promise<{ text: string; html: string }> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (KootuExtractor)' },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch URL (HTTP ${res.status})`);
  }
  const html = await res.text();
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

const IMAGE_FETCH_LIMIT = 10;
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const IMAGE_TIMEOUT_MS = 10_000;

function extractImageUrls(html: string, pageUrl: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  // <img src="..."> and srcset variants
  const imgRe = /<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = imgRe.exec(html)) !== null) {
    let src = m[1].trim();
    if (!src || src.startsWith('data:')) continue;
    // Skip obvious sprite/icon paths and SVGs (Gemini chokes on raster-less SVG)
    if (/\.(svg)(\?|$)/i.test(src)) continue;
    if (/(?:^|\/)(icon|logo|favicon|sprite|avatar|emoji)/i.test(src)) continue;
    try {
      const abs = new URL(src, pageUrl).toString();
      if (!seen.has(abs)) {
        seen.add(abs);
        out.push(abs);
      }
    } catch {
      // ignore unparseable
    }
    if (out.length >= IMAGE_FETCH_LIMIT * 3) break; // collect a bit extra to filter from
  }
  return out;
}

async function fetchImage(
  url: string
): Promise<{ data: string; mimeType: string } | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (KootuExtractor)' },
      signal: AbortSignal.timeout(IMAGE_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const ct = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!ct.startsWith('image/') || ct === 'image/svg+xml') return null;
    const len = Number(res.headers.get('content-length') || 0);
    if (len && len > IMAGE_MAX_BYTES) return null;
    const ab = await res.arrayBuffer();
    if (ab.byteLength > IMAGE_MAX_BYTES) return null;
    // Skip very small images — likely UI chrome, not posters.
    if (ab.byteLength < 8 * 1024) return null;
    return { data: Buffer.from(ab).toString('base64'), mimeType: ct };
  } catch {
    return null;
  }
}

async function fetchPageImages(
  imageUrls: string[]
): Promise<Array<{ inlineData: { data: string; mimeType: string } }>> {
  const candidates = imageUrls.slice(0, IMAGE_FETCH_LIMIT * 3);
  const fetched = await Promise.all(candidates.map(fetchImage));
  const ok = fetched.filter(
    (x): x is { data: string; mimeType: string } => x !== null
  );
  return ok.slice(0, IMAGE_FETCH_LIMIT).map((img) => ({ inlineData: img }));
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
