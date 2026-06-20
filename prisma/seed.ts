import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const merchants = [
  { name: 'Saravana Stores', category: 'Shopping', email: 'admin@saravanastores.com', phone: '+91 98410 12345', city: 'Chennai', status: 'approved' },
  { name: 'Hot Breads', category: 'Food & Dining', email: 'contact@hotbreads.in', phone: '+91 98410 23456', city: 'Chennai', status: 'pending' },
  { name: 'Pothys Silks', category: 'Fashion', email: 'digital@pothys.com', phone: '+91 98410 34567', city: 'Salem', status: 'pending' },
  { name: 'Nilgiris', category: 'Shopping', email: 'admin@nilgiris.com', phone: '+91 98410 45678', city: 'Chennai', status: 'approved' },
  { name: 'KFC India', category: 'Food & Dining', email: 'partner@kfc.in', phone: '+91 98410 56789', city: 'Chennai', status: 'rejected' },
  { name: 'Croma Electronics', category: 'Electronics', email: 'b2b@croma.com', phone: '+91 98410 67890', city: 'Salem', status: 'approved' },
];

const offers = [
  { title: '50% Off on All Sarees', merchant: 'Pothys Silks', category: 'Fashion', discount: '50%', description: 'Flat 50% off on silk sarees this wedding season', validUntil: '2025-03-31', status: 'active', source: 'manual' },
  { title: 'Buy 1 Get 1 Free on Burgers', merchant: 'KFC India', category: 'Food & Dining', discount: 'BOGO', description: 'Buy any burger, get one free every weekend', validUntil: '2025-03-15', status: 'pending', source: 'ai' },
  { title: '10% Off on Laptops & Phones', merchant: 'Croma Electronics', category: 'Electronics', discount: '10%', description: '10% off on all laptops and smartphones above ₹20,000', validUntil: '2025-04-30', status: 'active', source: 'ai' },
  { title: 'Free Bread on Orders ₹500+', merchant: 'Hot Breads', category: 'Food & Dining', discount: 'Free item', description: 'Get a free loaf of bread on any order above ₹500', validUntil: '2025-03-10', status: 'pending', source: 'manual' },
  { title: 'Grocery Combo Pack at ₹199', merchant: 'Nilgiris', category: 'Shopping', discount: '₹199 combo', description: 'Essential grocery combo worth ₹350 at just ₹199', validUntil: '2025-03-20', status: 'active', source: 'ai' },
  { title: 'Season Clearance Sale 40% Off', merchant: 'Saravana Stores', category: 'Fashion', discount: '40%', description: 'Clearance on all apparel. Limited period offer', validUntil: '2025-02-28', status: 'expired', source: 'manual' },
];

async function main() {
  for (const m of merchants) {
    await prisma.merchant.upsert({
      where: { email: m.email },
      update: {},
      create: m,
    });
  }

  for (const o of offers) {
    const merchant = await prisma.merchant.findFirst({ where: { name: o.merchant } });
    const existing = await prisma.offer.findFirst({ where: { title: o.title } });
    if (existing) continue;
    await prisma.offer.create({
      data: {
        title: o.title,
        category: o.category,
        discount: o.discount,
        description: o.description,
        validUntil: o.validUntil,
        status: o.status,
        source: o.source,
        merchantId: merchant?.id,
      },
    });
  }

  console.log('Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
