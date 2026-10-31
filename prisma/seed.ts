import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Create Counters
  const counter1 = await prisma.counter.upsert({
    where: { name: "Counter 1" },
    update: {},
    create: {
      name: "Counter 1",
      description: "Regular / Normal Retail Billing Workstation",
      isActive: true,
    },
  });

  const counter2 = await prisma.counter.upsert({
    where: { name: "Counter 2" },
    update: {},
    create: {
      name: "Counter 2",
      description: "Bulk / Project Orders Billing Workstation",
      isActive: true,
    },
  });

  console.log("Counters created:", counter1.name, counter2.name);

  // 2. Create Users
  const hashedPassword1 = await bcrypt.hash("password123", 10);
  const user1 = await prisma.user.upsert({
    where: { username: "user1" },
    update: {
      name: "Billing Staff",
      password: hashedPassword1,
      counterId: counter1.id,
    },
    create: {
      name: "Billing Staff",
      username: "user1",
      password: hashedPassword1,
      role: "COUNTER_USER",
      counterId: counter1.id,
      isActive: true,
    },
  });

  const hashedPassword2 = await bcrypt.hash("password123", 10);
  const user2 = await prisma.user.upsert({
    where: { username: "user2" },
    update: {
      name: "Terminal Operator",
      password: hashedPassword2,
      counterId: counter2.id,
    },
    create: {
      name: "Terminal Operator",
      username: "user2",
      password: hashedPassword2,
      role: "COUNTER_USER",
      counterId: counter2.id,
      isActive: true,
    },
  });

  console.log("Users created: user1 (Counter 1), user2 (Counter 2)");

  // 3. Company Settings
  const existingSettings = await prisma.companySettings.findFirst();
  if (!existingSettings) {
    await prisma.companySettings.create({
      data: {
        name: "SEYON UPVC",
        address: "SF No 245, Avinashi Road, Civil Aerodrome Post",
        city: "Coimbatore",
        state: "Tamil Nadu",
        pincode: "641014",
        phone: "+91 98422 12345",
        email: "",
        website: "",
        gstin: "33AABCS1234A1Z5",
        pan: "AABCS1234A",
        bankName: "State Bank of India",
        bankAccount: "38920192831",
        bankIFSC: "SBIN0001234",
        bankBranch: "Coimbatore Main Branch",
        quotationPrefix: "QT-",
        invoicePrefix: "INV-",
        quotationValidity: 15,
        quotationTerms:
          "1. Quotation validity is 15 days from date of issue.\n2. 50% advance along with confirmed purchase order.\n3. Taxes extra as applicable at time of billing.\n4. Delivery within 10-14 working days after advance confirmation.",
        invoiceTerms:
          "1. Goods once sold will not be taken back or exchanged.\n2. Payment terms: 100% advance or as agreed.\n3. All disputes subject to Coimbatore jurisdiction only.\n4. Interest @ 18% p.a. will be charged on overdue payments.",
        placeOfSupply: "33-Tamil Nadu",
        stateCode: "33",
      },
    });
  }

  // 4. Categories & Products
  const catWindows = await prisma.category.upsert({
    where: { name: "UPVC Windows" },
    update: {},
    create: { name: "UPVC Windows" },
  });

  const catDoors = await prisma.category.upsert({
    where: { name: "UPVC Doors" },
    update: {},
    create: { name: "UPVC Doors" },
  });

  const catHardware = await prisma.category.upsert({
    where: { name: "Hardware & Fittings" },
    update: {},
    create: { name: "Hardware & Fittings" },
  });

  const sampleProducts = [
    {
      name: "2-Track Sliding Window 4x4 ft",
      code: "UPVC-SL-2T-44",
      categoryId: catWindows.id,
      hsnSac: "39252000",
      unit: "Sq.Ft",
      mrp: 650,
      sellingPrice: 550,
      gstPercent: 18,
      stock: 120,
    },
    {
      name: "3-Track Sliding Window with Mesh 5x4 ft",
      code: "UPVC-SL-3TM-54",
      categoryId: catWindows.id,
      hsnSac: "39252000",
      unit: "Sq.Ft",
      mrp: 850,
      sellingPrice: 720,
      gstPercent: 18,
      stock: 80,
    },
    {
      name: "Casement Openable Window 3x4 ft",
      code: "UPVC-CS-34",
      categoryId: catWindows.id,
      hsnSac: "39252000",
      unit: "Sq.Ft",
      mrp: 900,
      sellingPrice: 780,
      gstPercent: 18,
      stock: 65,
    },
    {
      name: "UPVC Bathroom Door 2.5x7 ft Frosted Glass",
      code: "UPVC-DR-257",
      categoryId: catDoors.id,
      hsnSac: "39252000",
      unit: "Sq.Ft",
      mrp: 7500,
      sellingPrice: 6200,
      gstPercent: 18,
      stock: 35,
    },
    {
      name: "Heavy Duty Multi-Point Lock",
      code: "HDW-MPL-01",
      categoryId: catHardware.id,
      hsnSac: "83014090",
      unit: "Sq.Ft",
      mrp: 450,
      sellingPrice: 380,
      gstPercent: 18,
      stock: 250,
    },
    {
      name: "Heavy Duty Sliding Roller (Pair)",
      code: "HDW-RLR-02",
      categoryId: catHardware.id,
      hsnSac: "83024110",
      unit: "Sq.Ft",
      mrp: 180,
      sellingPrice: 140,
      gstPercent: 18,
      stock: 500,
    },
  ];

  for (const prod of sampleProducts) {
    await prisma.product.upsert({
      where: { code: prod.code },
      update: {
        sellingPrice: prod.sellingPrice,
        mrp: prod.mrp,
      },
      create: prod,
    });
  }

  // 5. Sample Customers
  const sampleCustomers = [
    {
      name: "Sri Krishna Constructions",
      phone: "9843012345",
      email: "info@srikrishnaconstructions.com",
      address: "142 Trichy Road, Singanallur",
      city: "Coimbatore",
      state: "Tamil Nadu",
      pincode: "641005",
      gstin: "33AABCS8899Z1Z2",
      placeOfSupply: "33-Tamil Nadu",
    },
    {
      name: "Annamalai Builders & Promoters",
      phone: "9443198765",
      email: "annamalai.promoters@gmail.com",
      address: "54 Kangeyam Road",
      city: "Tiruppur",
      state: "Tamil Nadu",
      pincode: "641604",
      gstin: "33BBBPB1234K1Z8",
      placeOfSupply: "33-Tamil Nadu",
    },
  ];

  for (const cust of sampleCustomers) {
    const existing = await prisma.customer.findFirst({
      where: { name: cust.name },
    });
    if (!existing) {
      await prisma.customer.create({ data: cust });
    }
  }

  console.log("Seeding complete! Logins ready:");
  console.log("Counter 1 User -> username: user1 / password: password123");
  console.log("Counter 2 User -> username: user2 / password: password123");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
