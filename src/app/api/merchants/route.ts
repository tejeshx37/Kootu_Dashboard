import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
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
  const body = await req.json();
  const { name, category, email, phone, city, status } = body;

  if (!name || !category || !email || !city) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const merchant = await prisma.merchant.create({
      data: {
        name,
        category,
        email,
        phone: phone || '',
        city,
        status: status || 'pending',
      },
    });
    return NextResponse.json(merchant, { status: 201 });
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create merchant' }, { status: 500 });
  }
}
