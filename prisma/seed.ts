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

// --- Greater Chennai sample data ------------------------------------------
// Six neighbourhoods so wherever the admin is in Chennai, /api/offers/near
// returns hits within a few km. Coordinates are real centroids.

const chennaiMerchants = [
  // T. Nagar (12.9438, 80.2336)
  { name: 'GRT Jewellers T. Nagar', category: 'Shopping', email: 'tnagar@grt.in', phone: '+91 98410 70001', city: 'Chennai', area: 'T. Nagar', address: '21 North Usman Rd, T. Nagar, Chennai 600017', latitude: 12.9438, longitude: 80.2336, status: 'approved' },
  { name: 'Hot Chips T. Nagar', category: 'Food & Dining', email: 'tnagar@hotchips.in', phone: '+91 98410 70002', city: 'Chennai', area: 'T. Nagar', address: 'Ranganathan St, T. Nagar, Chennai 600017', latitude: 12.9446, longitude: 80.2330, status: 'approved' },
  // Anna Nagar (13.0850, 80.2101)
  { name: 'Chennai Silks Anna Nagar', category: 'Fashion', email: 'annanagar@chennaisilks.in', phone: '+91 98410 70003', city: 'Chennai', area: 'Anna Nagar', address: '2nd Ave, Anna Nagar West, Chennai 600040', latitude: 13.0856, longitude: 80.2110, status: 'approved' },
  { name: 'Reliance Digital Anna Nagar', category: 'Electronics', email: 'annanagar@reldigital.in', phone: '+91 98410 70004', city: 'Chennai', area: 'Anna Nagar', address: 'VR Mall, Anna Nagar, Chennai 600040', latitude: 13.0840, longitude: 80.2095, status: 'approved' },
  // Adyar (13.0067, 80.2570)
  { name: 'Adyar Ananda Bhavan', category: 'Food & Dining', email: 'adyar@a2b.in', phone: '+91 98410 70005', city: 'Chennai', area: 'Adyar', address: 'L.B. Rd, Adyar, Chennai 600020', latitude: 13.0070, longitude: 80.2566, status: 'approved' },
  { name: 'Naturals Spa Adyar', category: 'Beauty', email: 'adyar@naturalsspa.in', phone: '+91 98410 70006', city: 'Chennai', area: 'Adyar', address: 'Sardar Patel Rd, Adyar, Chennai 600020', latitude: 13.0061, longitude: 80.2574, status: 'approved' },
  // OMR / Thoraipakkam (12.9351, 80.2329)
  { name: 'PVR Cinemas Sathyabama', category: 'Entertainment', email: 'omr@pvr.in', phone: '+91 98410 70007', city: 'Chennai', area: 'Thoraipakkam', address: 'OMR, Thoraipakkam, Chennai 600097', latitude: 12.9351, longitude: 80.2329, status: 'approved' },
  { name: 'Decathlon OMR', category: 'Shopping', email: 'omr@decathlon.in', phone: '+91 98410 70008', city: 'Chennai', area: 'Thoraipakkam', address: 'OMR, Thoraipakkam, Chennai 600097', latitude: 12.9362, longitude: 80.2335, status: 'approved' },
  // Tambaram (12.9229, 80.1275)
  { name: 'MakeMyTrip Holiday Store Tambaram', category: 'Travel', email: 'tambaram@mmt.in', phone: '+91 98410 70009', city: 'Chennai', area: 'Tambaram', address: 'GST Rd, Tambaram, Chennai 600045', latitude: 12.9229, longitude: 80.1275, status: 'approved' },
  { name: 'Apollo Clinic Tambaram', category: 'Health', email: 'tambaram@apolloclinic.in', phone: '+91 98410 70010', city: 'Chennai', area: 'Tambaram', address: 'Velachery Main Rd, Tambaram, Chennai 600045', latitude: 12.9241, longitude: 80.1289, status: 'approved' },
  // Mylapore (13.0339, 80.2698)
  { name: 'Sangeetha Mobiles Mylapore', category: 'Electronics', email: 'mylapore@sangeetha.in', phone: '+91 98410 70011', city: 'Chennai', area: 'Mylapore', address: 'Luz Church Rd, Mylapore, Chennai 600004', latitude: 13.0339, longitude: 80.2698, status: 'approved' },
  { name: 'Karpagambal Mess Mylapore', category: 'Food & Dining', email: 'mylapore@karpagambal.in', phone: '+91 98410 70012', city: 'Chennai', area: 'Mylapore', address: 'East Mada St, Mylapore, Chennai 600004', latitude: 13.0346, longitude: 80.2704, status: 'approved' },
];

const chennaiOffers = [
  // T. Nagar
  { title: 'Diamond Jewellery — Zero Making Charges', merchant: 'GRT Jewellers T. Nagar', category: 'Shopping', discount: '0% making', description: 'Zero making charges on diamond jewellery this month', validUntil: '2026-09-30', status: 'active', source: 'manual' },
  { title: 'Snack Combo Pack at ₹149', merchant: 'Hot Chips T. Nagar', category: 'Food & Dining', discount: '₹149 combo', description: 'Murukku + mixture + sweet combo worth ₹220 at ₹149', validUntil: '2026-12-31', status: 'active', source: 'manual' },
  // Anna Nagar
  { title: 'Saree Festival — Flat 25% Off', merchant: 'Chennai Silks Anna Nagar', category: 'Fashion', discount: '25%', description: 'Flat 25% off on all silk and cotton sarees', validUntil: '2026-08-31', status: 'active', source: 'manual' },
  { title: '₹5,000 Off on Large TVs', merchant: 'Reliance Digital Anna Nagar', category: 'Electronics', discount: '₹5,000 off', description: '₹5,000 instant discount on 55-inch and above TVs', validUntil: '2026-10-31', status: 'active', source: 'manual' },
  // Adyar
  { title: 'Mini Tiffin at ₹99', merchant: 'Adyar Ananda Bhavan', category: 'Food & Dining', discount: '₹99 combo', description: '4-item mini tiffin combo every weekday 4-7pm', validUntil: '2026-12-31', status: 'active', source: 'manual' },
  { title: 'Bridal Spa Package 30% Off', merchant: 'Naturals Spa Adyar', category: 'Beauty', discount: '30%', description: 'Bridal full-body spa package, save 30% when booked 30 days in advance', validUntil: '2026-09-30', status: 'active', source: 'manual' },
  // OMR / Thoraipakkam
  { title: 'Tuesday Movies at ₹150', merchant: 'PVR Cinemas Sathyabama', category: 'Entertainment', discount: '₹150 ticket', description: 'All shows every Tuesday at flat ₹150 incl. taxes', validUntil: '2026-12-31', status: 'active', source: 'manual' },
  { title: 'Cycling Gear Combo at ₹999', merchant: 'Decathlon OMR', category: 'Shopping', discount: '₹999 combo', description: 'Cycling helmet + gloves + light combo at ₹999', validUntil: '2026-11-30', status: 'active', source: 'manual' },
  // Tambaram
  { title: 'Goa 3N/4D Package from ₹9,999', merchant: 'MakeMyTrip Holiday Store Tambaram', category: 'Travel', discount: '₹9,999 package', description: '3N/4D Goa package incl. flights, breakfast and transfers', validUntil: '2026-09-30', status: 'active', source: 'manual' },
  { title: 'Full Body Health Check at ₹999', merchant: 'Apollo Clinic Tambaram', category: 'Health', discount: '₹999 package', description: '60+ parameter health checkup worth ₹2,500 at ₹999', validUntil: '2026-12-31', status: 'active', source: 'manual' },
  // Mylapore
  { title: 'Free Wireless Earbuds with iPhones', merchant: 'Sangeetha Mobiles Mylapore', category: 'Electronics', discount: 'Free earbuds', description: 'Free Sangeetha branded earbuds with any iPhone purchase', validUntil: '2026-08-31', status: 'active', source: 'manual' },
  { title: 'Unlimited South Indian Thali ₹179', merchant: 'Karpagambal Mess Mylapore', category: 'Food & Dining', discount: '₹179 unlimited', description: 'Unlimited South Indian thali every lunch hour at ₹179', validUntil: '2026-12-31', status: 'active', source: 'manual' },
];

// --- Kundrathur / Malayambakkam (user's college area) ---------------------
// Tight cluster around 12.997, 80.100 — Sarathy Nagar, Kundrathur,
// Malayambakkam (PIN 600133). Lots of student-friendly offers so the
// "offers near me" feed feels alive on the consumer app.

const kundrathurMerchants = [
  { name: 'Sairam Tiffin Centre', category: 'Food & Dining', email: 'sairam@tiffincentre.in', phone: '+91 98410 80001', city: 'Chennai', area: 'Kundrathur', address: 'Sarathy Nagar, Kundrathur, Chennai 600133', latitude: 12.9985, longitude: 80.1002, status: 'approved' },
  { name: 'Hot Cup Cafe Malayambakkam', category: 'Food & Dining', email: 'hotcup@malayambakkam.in', phone: '+91 98410 80002', city: 'Chennai', area: 'Malayambakkam', address: 'Malayambakkam Main Rd, Chennai 600133', latitude: 12.9970, longitude: 80.1005, status: 'approved' },
  { name: 'Pothys Express Kundrathur', category: 'Fashion', email: 'kundrathur@pothys.com', phone: '+91 98410 80003', city: 'Chennai', area: 'Kundrathur', address: 'Pillaiyar Koil St, Kundrathur, Chennai 600069', latitude: 12.9952, longitude: 80.0937, status: 'approved' },
  { name: 'Sangeetha Mobiles Kundrathur', category: 'Electronics', email: 'kundrathur@sangeetha.in', phone: '+91 98410 80004', city: 'Chennai', area: 'Kundrathur', address: 'Kundrathur Junction, Chennai 600069', latitude: 12.9948, longitude: 80.0942, status: 'approved' },
  { name: 'Apollo Pharmacy Kundrathur', category: 'Health', email: 'kundrathur@apollopharmacy.in', phone: '+91 98410 80005', city: 'Chennai', area: 'Kundrathur', address: 'Opp. Bus Stand, Kundrathur, Chennai 600069', latitude: 12.9956, longitude: 80.0945, status: 'approved' },
  { name: 'Naturals Hair Salon Malayambakkam', category: 'Beauty', email: 'malayambakkam@naturals.in', phone: '+91 98410 80006', city: 'Chennai', area: 'Malayambakkam', address: 'Sarathy Nagar Main Rd, Malayambakkam, Chennai 600133', latitude: 12.9978, longitude: 80.1010, status: 'approved' },
  { name: 'PVR Forum Vijaya', category: 'Entertainment', email: 'forumvijaya@pvr.in', phone: '+91 98410 80007', city: 'Chennai', area: 'Vadapalani', address: 'Forum Vijaya Mall, Vadapalani, Chennai 600026', latitude: 13.0501, longitude: 80.2118, status: 'approved' },
  { name: 'MakeMyTrip Express Porur', category: 'Travel', email: 'porur@mmt.in', phone: '+91 98410 80008', city: 'Chennai', area: 'Porur', address: 'Mount-Poonamallee Rd, Porur, Chennai 600116', latitude: 13.0379, longitude: 80.1565, status: 'approved' },
];

const kundrathurOffers = [
  // Sairam Tiffin Centre — student tiffin
  { title: 'Student Tiffin Combo ₹49', merchant: 'Sairam Tiffin Centre', category: 'Food & Dining', discount: '₹49 combo', description: 'Idli + dosa + filter coffee for students with ID. 7-11am.', validUntil: '2026-12-31', status: 'active', source: 'manual' },
  { title: 'Parotta + Salna at ₹79', merchant: 'Sairam Tiffin Centre', category: 'Food & Dining', discount: '₹79 combo', description: 'Two parottas with chicken salna for ₹79 every evening', validUntil: '2026-10-31', status: 'active', source: 'manual' },
  // Hot Cup Cafe
  { title: 'Buy 1 Get 1 on Cold Coffee', merchant: 'Hot Cup Cafe Malayambakkam', category: 'Food & Dining', discount: 'BOGO', description: 'Buy any cold coffee, get one free. 2-5pm weekdays.', validUntil: '2026-09-30', status: 'active', source: 'manual' },
  { title: 'Free Brownie with Any Meal', merchant: 'Hot Cup Cafe Malayambakkam', category: 'Food & Dining', discount: 'Free item', description: 'Complimentary brownie on any meal above ₹250', validUntil: '2026-08-31', status: 'active', source: 'manual' },
  // Pothys Express
  { title: 'Flat ₹500 Off on Sarees Above ₹2,500', merchant: 'Pothys Express Kundrathur', category: 'Fashion', discount: '₹500 off', description: 'Instant ₹500 discount on any saree priced ₹2,500+', validUntil: '2026-11-30', status: 'active', source: 'manual' },
  // Sangeetha Mobiles
  { title: '₹2,000 Off on Smartphones Above ₹15,000', merchant: 'Sangeetha Mobiles Kundrathur', category: 'Electronics', discount: '₹2,000 off', description: 'Flat ₹2,000 off on smartphones above ₹15,000', validUntil: '2026-10-31', status: 'active', source: 'manual' },
  { title: 'Free Tempered Glass with Every Phone', merchant: 'Sangeetha Mobiles Kundrathur', category: 'Electronics', discount: 'Free item', description: 'Complimentary tempered glass + back cover on any new phone', validUntil: '2026-12-31', status: 'active', source: 'manual' },
  // Apollo Pharmacy
  { title: '20% Off on All Vitamins', merchant: 'Apollo Pharmacy Kundrathur', category: 'Health', discount: '20%', description: 'Flat 20% off on all multivitamin and supplement brands', validUntil: '2026-12-31', status: 'active', source: 'manual' },
  // Naturals Hair Salon
  { title: 'Hair Cut + Wash at ₹299', merchant: 'Naturals Hair Salon Malayambakkam', category: 'Beauty', discount: '₹299 combo', description: 'Premium hair cut + wash + blow-dry at ₹299 (worth ₹600)', validUntil: '2026-09-30', status: 'active', source: 'manual' },
  // PVR Forum Vijaya
  { title: 'Weekday Movies at ₹150 (Vadapalani)', merchant: 'PVR Forum Vijaya', category: 'Entertainment', discount: '₹150 ticket', description: 'All shows Mon-Thu at flat ₹150 with student ID', validUntil: '2026-12-31', status: 'active', source: 'manual' },
  // MakeMyTrip
  { title: 'Pondicherry Weekend ₹3,499/person', merchant: 'MakeMyTrip Express Porur', category: 'Travel', discount: '₹3,499 package', description: '2N/3D Pondicherry weekend package incl. stay and breakfast', validUntil: '2026-10-31', status: 'active', source: 'manual' },
];
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

  for (const m of [...chennaiMerchants, ...kundrathurMerchants]) {
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

  for (const o of [...chennaiOffers, ...kundrathurOffers]) {
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
        area: merchant?.area ?? null,
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
