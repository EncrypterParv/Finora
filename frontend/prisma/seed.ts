import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Finora synthetic demo data...");

  // 1. Create or upsert Demo User
  const demoAuthId = "00000000-0000-0000-0000-000000000001";
  const user = await prisma.user.upsert({
    where: { email: "demo@finora.internal" },
    update: {},
    create: {
      id: "demo-user-1",
      authUserId: demoAuthId,
      email: "demo@finora.internal",
      fullName: "Finora Demo User",
      currency: "INR",
      preferences: { theme: "amoled", currency: "INR" },
    },
  });
  console.log("✓ Demo user seeded:", user.id);

  // 2. Seed Categories
  const categoriesData = [
    { name: "Food & Dining", slug: "food-dining", icon: "Utensils", colorHex: "#F59E0B" },
    { name: "Transportation", slug: "transportation", icon: "Car", colorHex: "#3B82F6" },
    { name: "Groceries", slug: "groceries", icon: "ShoppingBag", colorHex: "#10B981" },
    { name: "Bills & Utilities", slug: "bills-utilities", icon: "Zap", colorHex: "#EF4444" },
    { name: "Shopping", slug: "shopping", icon: "Tag", colorHex: "#8B5CF6" },
    { name: "Entertainment", slug: "entertainment", icon: "Film", colorHex: "#EC4899" },
    { name: "Income", slug: "income", icon: "DollarSign", colorHex: "#34D399" },
  ];

  const categoryMap = new Map<string, string>();
  for (const cat of categoriesData) {
    const c = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        colorHex: cat.colorHex,
        isSystem: true,
      },
    });
    categoryMap.set(cat.name, c.id);
  }
  console.log(`✓ Seeded ${categoriesData.length} categories`);

  // 3. Seed Bank Accounts
  const account1 = await prisma.bankAccount.upsert({
    where: {
      uq_bank_accounts_id_user: {
        id: "acc-demo-1",
        userId: user.id,
      },
    },
    update: {},
    create: {
      id: "acc-demo-1",
      userId: user.id,
      institutionName: "HDFC Bank",
      accountNumberMasked: "•••• 4821",
      accountType: "SAVINGS",
      currentBalance: new Prisma.Decimal(128450.0),
      currency: "INR",
      adapterType: "SIMULATED",
    },
  });

  const account2 = await prisma.bankAccount.upsert({
    where: {
      uq_bank_accounts_id_user: {
        id: "acc-demo-2",
        userId: user.id,
      },
    },
    update: {},
    create: {
      id: "acc-demo-2",
      userId: user.id,
      institutionName: "State Bank of India",
      accountNumberMasked: "•••• 9104",
      accountType: "CURRENT",
      currentBalance: new Prisma.Decimal(45200.0),
      currency: "INR",
      adapterType: "SIMULATED",
    },
  });
  console.log("✓ Seeded demo bank accounts:", account1.id, account2.id);

  // 4. Seed Synthetic Transactions
  const rawTxList = [
    { merchant: "Sample monthly income", cat: "Income", amt: 75000, type: "CREDIT", day: "01", time: "09:00", desc: "SYNTHETIC MONTHLY INCOME" },
    { merchant: "Blue Tokai", cat: "Food & Dining", amt: 320, type: "DEBIT", day: "03", time: "10:15", desc: "SAMPLE / Blue Tokai" },
    { merchant: "Namma Metro", cat: "Transportation", amt: 120, type: "DEBIT", day: "04", time: "18:30", desc: "SAMPLE / Namma Metro" },
    { merchant: "Fresh produce", cat: "Groceries", amt: 1840, type: "DEBIT", day: "05", time: "10:15", desc: "SAMPLE / Fresh produce" },
    { merchant: "Monthly rent", cat: "Bills & Utilities", amt: 15000, type: "DEBIT", day: "06", time: "18:30", desc: "SAMPLE / Monthly rent" },
    { merchant: "Swiggy", cat: "Food & Dining", amt: 650, type: "DEBIT", day: "07", time: "10:15", desc: "SAMPLE / Swiggy" },
    { merchant: "Bookshop", cat: "Shopping", amt: 1250, type: "DEBIT", day: "08", time: "18:30", desc: "SAMPLE / Bookshop" },
    { merchant: "Cinema", cat: "Entertainment", amt: 680, type: "DEBIT", day: "09", time: "10:15", desc: "SAMPLE / Cinema" },
    { merchant: "Electricity", cat: "Bills & Utilities", amt: 1890, type: "DEBIT", day: "10", time: "18:30", desc: "SAMPLE / Electricity" },
    { merchant: "Weekend lunch", cat: "Food & Dining", amt: 2400, type: "DEBIT", day: "11", time: "10:15", desc: "SAMPLE / Weekend lunch" },
  ];

  for (let i = 0; i < rawTxList.length; i++) {
    const item = rawTxList[i];
    const categoryId = categoryMap.get(item.cat);
    const occurredAt = new Date(`2026-10-${item.day}T${item.time}:00+05:30`);
    const dedupHash = `demo-seed-hash-${i + 1}`;

    await prisma.transaction.upsert({
      where: { dedupHash },
      update: {},
      create: {
        id: `demo-tx-seed-${i + 1}`,
        userId: user.id,
        accountId: account1.id,
        categoryId: categoryId ?? null,
        occurredAt,
        amount: new Prisma.Decimal(item.amt),
        currency: "INR",
        transactionType: item.type,
        rawDescription: item.desc,
        referenceId: `REF-SEED-${i + 1}`,
        source: "MANUAL",
        dedupHash,
        metadata: { demo: true, synthetic: true },
      },
    });
  }
  console.log(`✓ Seeded ${rawTxList.length} canonical transactions`);

  // 5. Seed Budgets
  await prisma.budget.create({
    data: {
      userId: user.id,
      name: "October Discretionary Budget",
      period: "MONTHLY",
      totalLimit: new Prisma.Decimal(25000),
      startDate: new Date("2026-10-01"),
      endDate: new Date("2026-10-31"),
    },
  });
  console.log("✓ Seeded demo budget");

  // 6. Seed Financial Goals
  await prisma.financialGoal.create({
    data: {
      userId: user.id,
      title: "Emergency Fund (6 Months)",
      goalType: "EMERGENCY_FUND",
      targetAmount: new Prisma.Decimal(300000),
      currentSaved: new Prisma.Decimal(128450),
      monthlyContribution: new Prisma.Decimal(20000),
      targetDate: new Date("2027-06-30"),
      expectedAnnualReturnPct: new Prisma.Decimal(6.5),
      status: "ACTIVE",
    },
  });
  console.log("✓ Seeded demo financial goal");

  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
