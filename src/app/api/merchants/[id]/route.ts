import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/apiAuth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const unauthorized = await requireAuth(req);
  if (unauthorized) return unauthorized;

  const id = parseInt(params.id, 10);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const body = await req.json();
  const updates: any = {};
  if (body.status) updates.status = body.status;
  if (body.name) updates.name = body.name;
  if (body.category) updates.category = body.category;
  if (body.phone !== undefined) updates.phone = body.phone;
  if (body.city) updates.city = body.city;

  try {
    const merchant = await prisma.merchant.update({ where: { id }, data: updates });
    return NextResponse.json(merchant);
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
