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
  for (const f of ['title', 'discount', 'description', 'category', 'validUntil', 'status', 'source'] as const) {
    if (body[f] !== undefined) updates[f] = body[f];
  }
  if (body.merchantId !== undefined) {
    updates.merchantId = body.merchantId === null ? null : Number(body.merchantId);
  }

  try {
    const offer = await prisma.offer.update({ where: { id }, data: updates });
    return NextResponse.json(offer);
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const unauthorized = await requireAuth(req);
  if (unauthorized) return unauthorized;

  const id = parseInt(params.id, 10);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  try {
    await prisma.offer.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
