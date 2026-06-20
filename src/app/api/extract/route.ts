import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import mammoth from 'mammoth';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/apiAuth';
import { mirrorExtractionLog } from '@/lib/firebase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `You are an offer extraction specialist. Extract ALL offers, deals, discounts, and promotions from the provided content. Return ONLY a raw JSON array with no markdown fences, no explanation. Each item must have exactly these fields:
{"title":"offer title","merchant":"brand/merchant name","discount":"e.g. 30% off or BOGO or Free item","description":"brief description under 100 chars","validUntil":"YYYY-MM-DD or empty string","category":"Food & Dining|Fashion|Electronics|Travel|Beauty|Health|Entertainment|Shopping"}
If a field is unknown use empty string. Never return empty array without trying hard.`;

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

async function fetchUrlAsText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (KootuExtractor)' },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch URL (HTTP ${res.status})`);
  }
  const html = await res.text();
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 50_000);
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

    if (sourceType === 'text') {
      if (!content.trim()) return NextResponse.json({ error: 'No content provided' }, { status: 400 });
      userMessage = content;
    } else if (sourceType === 'url') {
      if (!content.trim()) return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
      sourceRef = content;
      const pageText = await fetchUrlAsText(content);
      if (!pageText) {
        return NextResponse.json({ error: 'Fetched page had no readable text' }, { status: 400 });
      }
      userMessage = `Source URL: ${content}\n\n${pageText}`;
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
    if (userMessage) parts.push({ text: userMessage });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts }],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        maxOutputTokens: 2000,
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
