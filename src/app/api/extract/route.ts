import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import mammoth from 'mammoth';
import { prisma } from '@/lib/prisma';

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
  // balanced-bracket fallback
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

export async function POST(req: NextRequest) {
  try {
    const { sourceType, content, file } = await readFormFile(req);

    if (!['url', 'text', 'pdf', 'docx'].includes(sourceType)) {
      return NextResponse.json({ error: 'Invalid sourceType' }, { status: 400 });
    }

    let userMessage = '';
    let sourceRef: string | null = null;
    const tools: any[] = [];

    if (sourceType === 'text') {
      if (!content.trim()) return NextResponse.json({ error: 'No content provided' }, { status: 400 });
      userMessage = content;
    } else if (sourceType === 'url') {
      if (!content.trim()) return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
      sourceRef = content;
      userMessage = `Search the web for offers, deals, and promotions on this page: ${content}\n\nExtract all offers from that source.`;
      tools.push({ type: 'web_search_20250305', name: 'web_search' });
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
    }

    if (!userMessage.trim()) {
      return NextResponse.json({ error: 'No extractable content found' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured' }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      tools: tools.length ? tools : undefined,
      messages: [{ role: 'user', content: userMessage }],
    });

    const textBlock = response.content.find((b: any) => b.type === 'text') as { type: 'text'; text: string } | undefined;
    const raw = textBlock?.text || '';
    const offers = parseOffers(raw);

    await prisma.extractionLog.create({
      data: {
        sourceType,
        sourceRef,
        offersFound: offers.length,
      },
    });

    return NextResponse.json({ offers, count: offers.length });
  } catch (err: any) {
    console.error('Extract error:', err);
    return NextResponse.json({ error: err?.message || 'Extraction failed' }, { status: 500 });
  }
}
