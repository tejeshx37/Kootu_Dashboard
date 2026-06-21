import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/apiAuth';
import { mirrorMerchant } from '@/lib/firebase';
import { geocodeAddress } from '@/lib/geocode';

export async function GET(req: NextRequest) {
  const unauthorized = await requireAuth(req);
  if (unauthorized) return unauthorized;

  const status = req.nextUrl.searchParams.get('status');
  const search = req.nextUrl.searchParams.get('search');

  const where: any = {};
  if (status && status !== 'all') where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { city: { contains: search } },
    ];
  }

  const merchants = await prisma.merchant.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { offers: true } } },
  });

  return NextResponse.json(merchants);
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAuth(req);
  if (unauthorized) return unauthorized;

  const body = await req.json();
  const { name, category, email, phone, city, status, address, area } = body;
  let latitude = typeof body.latitude === 'number' ? body.latitude : null;
  let longitude = typeof body.longitude === 'number' ? body.longitude : null;

  if (!name || !category || !email || !city) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if ((latitude == null || longitude == null) && (address || area || city)) {
    const geo = await geocodeAddress([address, area, city].filter(Boolean).join(', '));
    if (geo) {
      latitude = geo.lat;
      longitude = geo.lng;
    }
  }

  try {
    const merchant = await prisma.merchant.create({
      data: {
        name,
        category,
        email,
        phone: phone || '',
        city,
        address: address || null,
        area: area || null,
        latitude,
        longitude,
        status: status || 'pending',
      },
    });
    await mirrorMerchant(merchant);
    return NextResponse.json(merchant, { status: 201 });
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create merchant' }, { status: 500 });
  }
}
