import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/apiAuth';
import { mirrorOffer } from '@/lib/firebase';
import { geocodeAddress } from '@/lib/geocode';

export async function GET(req: NextRequest) {
  const unauthorized = await requireAuth(req);
  if (unauthorized) return unauthorized;

  const status = req.nextUrl.searchParams.get('status');
  const source = req.nextUrl.searchParams.get('source');
  const search = req.nextUrl.searchParams.get('search');

  const where: any = {};
  if (status && status !== 'all') where.status = status;
  if (source && source !== 'all') where.source = source;
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { merchant: { is: { name: { contains: search } } } },
    ];
  }

  const offers = await prisma.offer.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { merchant: { select: { id: true, name: true } } },
  });

  return NextResponse.json(offers);
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAuth(req);
  if (unauthorized) return unauthorized;

  const body = await req.json();
  const { title, discount, description, category, validUntil, status, source, merchantId, merchantName, address, area } = body;
  let latitude = typeof body.latitude === 'number' ? body.latitude : null;
  let longitude = typeof body.longitude === 'number' ? body.longitude : null;

  if (!title || !category) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  let resolvedMerchantId: number | null = null;
  if (merchantId) {
    resolvedMerchantId = typeof merchantId === 'string' ? parseInt(merchantId, 10) : merchantId;
  } else if (merchantName) {
    const m = await prisma.merchant.findFirst({ where: { name: merchantName } });
    if (m) resolvedMerchantId = m.id;
  }

  if ((latitude == null || longitude == null) && (address || area)) {
    const geo = await geocodeAddress([address, area].filter(Boolean).join(', '));
    if (geo) {
      latitude = geo.lat;
      longitude = geo.lng;
    }
  }

  const offer = await prisma.offer.create({
    data: {
      title,
      discount: discount || '',
      description: description || '',
      category,
      validUntil: validUntil || null,
      status: status || 'pending',
      source: source || 'manual',
      address: address || null,
      area: area || null,
      latitude,
      longitude,
      merchantId: resolvedMerchantId,
    },
    include: { merchant: { select: { id: true, name: true } } },
  });

  await mirrorOffer(offer);
  return NextResponse.json(offer, { status: 201 });
}
