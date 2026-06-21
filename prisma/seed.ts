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

// --- Velachery sample data (for the consumer "offers near me" flow) -------
// Coordinates cluster around Phoenix MarketCity / Vijaya Nagar bus stand /
// 100 Feet Road, all within ~2 km of (12.9750, 80.2200).

const velacheryMerchants = [
  {
    name: 'Saravana Stores Velachery',
    category: 'Shopping',
    email: 'velachery@saravanastores.com',
    phone: '+91 98410 11111',
    city: 'Chennai',
    area: 'Velachery',
    address: '100 Feet Rd, Velachery, Chennai 600042',
    latitude: 12.9762,
    longitude: 80.2207,
    status: 'approved',
  },
  {
    name: 'Croma Velachery',
    category: 'Electronics',
    email: 'velachery@croma.com',
    phone: '+91 98410 22222',
    city: 'Chennai',
    area: 'Velachery',
    address: 'Phoenix MarketCity, Velachery Rd, Chennai 600042',
    latitude: 12.9909,
    longitude: 80.2174,
    status: 'approved',
  },
  {
    name: 'Hot Breads Velachery',
    category: 'Food & Dining',
    email: 'velachery@hotbreads.in',
    phone: '+91 98410 33333',
    city: 'Chennai',
    area: 'Velachery',
    address: 'Vijaya Nagar, Velachery, Chennai 600042',
    latitude: 12.9764,
    longitude: 80.2186,
    status: 'approved',
  },
  {
    name: 'Pothys Velachery',
    category: 'Fashion',
    email: 'velachery@pothys.com',
    phone: '+91 98410 44444',
    city: 'Chennai',
    area: 'Velachery',
    address: 'Velachery Main Rd, Chennai 600042',
    latitude: 12.9755,
    longitude: 80.2218,
    status: 'approved',
  },
  {
    name: 'Apollo Pharmacy Velachery',
    category: 'Health',
    email: 'velachery@apollopharmacy.in',
    phone: '+91 98410 55555',
    city: 'Chennai',
    area: 'Velachery',
    address: 'Next to SBI, 100 Feet Rd, Velachery, Chennai 600042',
    latitude: 12.9748,
    longitude: 80.2203,
    status: 'approved',
  },
  {
    name: 'Naturals Salon Velachery',
    category: 'Beauty',
    email: 'velachery@naturals.in',
    phone: '+91 98410 66666',
    city: 'Chennai',
    area: 'Velachery',
    address: 'Tansi Nagar, Velachery, Chennai 600042',
    latitude: 12.9778,
    longitude: 80.2230,
    status: 'approved',
  },
];

const velacheryOffers = [
  { title: 'Velachery Mega Sale — 30% Off Apparel', merchant: 'Saravana Stores Velachery', category: 'Fashion', discount: '30%', description: 'Flat 30% off on all apparel at our Velachery branch this weekend', validUntil: '2026-09-30', status: 'active', source: 'manual' },
  { title: 'Smartphone Exchange — Up to ₹15,000 Off', merchant: 'Croma Velachery', category: 'Electronics', discount: '₹15,000 off', description: 'Exchange your old phone, get up to ₹15,000 off on new ones', validUntil: '2026-08-31', status: 'active', source: 'manual' },
  { title: '20% Off on Refrigerators & Washing Machines', merchant: 'Croma Velachery', category: 'Electronics', discount: '20%', description: 'Festive offer on large appliances above ₹25,000', validUntil: '2026-10-31', status: 'active', source: 'manual' },
  { title: 'Buy 1 Get 1 on Cakes (Weekends Only)', merchant: 'Hot Breads Velachery', category: 'Food & Dining', discount: 'BOGO', description: 'Buy any cake on Sat / Sun, get one of equal value free', validUntil: '2026-12-31', status: 'active', source: 'manual' },
  { title: 'Free Coffee with Every Sandwich', merchant: 'Hot Breads Velachery', category: 'Food & Dining', discount: 'Free item', description: 'Complimentary cappuccino on every sandwich combo', validUntil: '2026-07-31', status: 'active', source: 'manual' },
  { title: 'Wedding Season — 40% Off Silks', merchant: 'Pothys Velachery', category: 'Fashion', discount: '40%', description: 'Flat 40% off on Kanchipuram and Banarasi silk sarees', validUntil: '2026-09-15', status: 'active', source: 'manual' },
  { title: '15% Off on Multivitamins & Supplements', merchant: 'Apollo Pharmacy Velachery', category: 'Health', discount: '15%', description: 'On purchases above ₹999. Free home delivery within 3 km.', validUntil: '2026-12-31', status: 'active', source: 'manual' },
  { title: 'Free BP Check + ₹100 Off on First Order', merchant: 'Apollo Pharmacy Velachery', category: 'Health', discount: '₹100 off', description: 'Walk-in free BP / sugar check; ₹100 off first purchase', validUntil: '2026-06-30', status: 'active', source: 'manual' },
  { title: 'Hair Spa + Cut Combo at ₹999', merchant: 'Naturals Salon Velachery', category: 'Beauty', discount: '₹999 combo', description: 'Hair spa + cut + blow-dry combo worth ₹1,800 at ₹999', validUntil: '2026-08-31', status: 'active', source: 'manual' },
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

  for (const m of velacheryMerchants) {
    await prisma.merchant.upsert({
      where: { email: m.email },
      update: {
        area: m.area,
        address: m.address,
        latitude: m.latitude,
        longitude: m.longitude,
      },
      create: m,
    });
  }

  for (const o of velacheryOffers) {
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
        area: merchant?.area ?? 'Velachery',
        address: merchant?.address ?? null,
        latitude: merchant?.latitude ?? null,
        longitude: merchant?.longitude ?? null,
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
