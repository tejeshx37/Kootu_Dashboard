import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/apiAuth';
import { mirrorMerchant, mirrorOffer, uploadSourceFile } from '@/lib/firebase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type IncomingOffer = {
  title?: string;
  discount?: string;
  description?: string;
  category?: string;
  validUntil?: string | null;
  merchantName?: string;
  address?: string;
  area?: string;
  city?: string;
  latitude?: number | string;
  longitude?: number | string;
};

function asNum(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

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
    let merchantRecord = null as null | { id: number; address: string | null; area: string | null; city: string; latitude: number | null; longitude: number | null };
    if (o.merchantName) {
      const m = await prisma.merchant.findFirst({ where: { name: o.merchantName } });
      if (m) {
        merchantId = m.id;
        merchantRecord = {
          id: m.id,
          address: m.address,
          area: m.area,
          city: m.city,
          latitude: m.latitude,
          longitude: m.longitude,
        };
      }
    }

    const lat = asNum(o.latitude);
    const lng = asNum(o.longitude);

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
        address: o.address || null,
        area: o.area || null,
        latitude: lat,
        longitude: lng,
        merchantId,
      },
      include: { merchant: { select: { id: true, name: true } } },
    });
    await mirrorOffer(offer);
    created.push(offer);

    // Backfill canonical merchant location only when the merchant has nothing
    // there yet — we never overwrite admin-curated data.
    if (merchantRecord && (lat != null || o.address || o.area)) {
      const updates: any = {};
      if (!merchantRecord.address && o.address) updates.address = o.address;
      if (!merchantRecord.area && o.area) updates.area = o.area;
      if (merchantRecord.latitude == null && lat != null) updates.latitude = lat;
      if (merchantRecord.longitude == null && lng != null) updates.longitude = lng;
      if (Object.keys(updates).length > 0) {
        const updated = await prisma.merchant.update({
          where: { id: merchantRecord.id },
          data: updates,
        });
        await mirrorMerchant(updated);
      }
    }
  }

  return NextResponse.json({ count: created.length, sourceFileUrl, sourceType, offers: created }, { status: 201 });
}
