import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/apiAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const EARTH_KM = 6371;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(req: NextRequest) {
  const unauthorized = await requireAuth(req);
  if (unauthorized) return unauthorized;

  const lat = Number(req.nextUrl.searchParams.get('lat'));
  const lng = Number(req.nextUrl.searchParams.get('lng'));
  const radiusKm = Number(req.nextUrl.searchParams.get('radiusKm') || '5');
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: 'lat and lng query params are required' }, { status: 400 });
  }
  if (!Number.isFinite(radiusKm) || radiusKm <= 0 || radiusKm > 100) {
    return NextResponse.json({ error: 'radiusKm must be between 0 and 100' }, { status: 400 });
  }

  const offers = await prisma.offer.findMany({
    where: { status: 'active' },
    include: {
      merchant: {
        select: { id: true, name: true, latitude: true, longitude: true, address: true, area: true, city: true },
      },
    },
  });

  const enriched = offers
    .map((o) => {
      const effLat = o.latitude ?? o.merchant?.latitude ?? null;
      const effLng = o.longitude ?? o.merchant?.longitude ?? null;
      if (effLat == null || effLng == null) return null;
      const distanceKm = haversineKm(lat, lng, effLat, effLng);
      if (distanceKm > radiusKm) return null;
      return { ...o, effectiveLatitude: effLat, effectiveLongitude: effLng, distanceKm };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return NextResponse.json({ count: enriched.length, offers: enriched });
}
