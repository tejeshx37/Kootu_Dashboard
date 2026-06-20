import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/apiAuth';
import { mirrorOffer, uploadSourceFile } from '@/lib/firebase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type IncomingOffer = {
  title?: string;
  discount?: string;
  description?: string;
  category?: string;
  validUntil?: string | null;
  merchantName?: string;
};

export async function POST(req: NextRequest) {
  const unauthorized = await requireAuth(req);
  if (unauthorized) return unauthorized;

  const form = await req.formData();
  const offersRaw = String(form.get('offers') || '[]');
  const sourceType = String(form.get('sourceType') || '');
  const file = form.get('file');

  let offersList: IncomingOffer[] = [];
  try {
    const parsed = JSON.parse(offersRaw);
    if (Array.isArray(parsed)) offersList = parsed;
  } catch {
    return NextResponse.json({ error: 'Invalid offers payload' }, { status: 400 });
  }
  if (offersList.length === 0) {
    return NextResponse.json({ error: 'No offers selected' }, { status: 400 });
  }

  let sourceFileUrl: string | null = null;
  if (file && typeof file !== 'string') {
    const f = file as File;
    const ab = await f.arrayBuffer();
    sourceFileUrl = await uploadSourceFile(
      Buffer.from(ab),
      f.name || `source-${Date.now()}`,
      f.type || 'application/octet-stream'
    );
  }

  const created = [];
  for (const o of offersList) {
    let merchantId: number | null = null;
    if (o.merchantName) {
      const m = await prisma.merchant.findFirst({ where: { name: o.merchantName } });
      if (m) merchantId = m.id;
    }
    const offer = await prisma.offer.create({
      data: {
        title: o.title || 'Untitled offer',
        discount: o.discount || '',
        description: o.description || '',
        category: o.category || 'Shopping',
        validUntil: o.validUntil || null,
        status: 'pending',
        source: 'ai',
        sourceFileUrl,
        merchantId,
      },
      include: { merchant: { select: { id: true, name: true } } },
    });
    await mirrorOffer(offer);
    created.push(offer);
  }

  return NextResponse.json({ count: created.length, sourceFileUrl, sourceType, offers: created }, { status: 201 });
}
