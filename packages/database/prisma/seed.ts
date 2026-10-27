import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Pre-hashed password for "Password@123"
  const passwordHash = "$2b$10$K7B3YwzUeZ5v7c5Y0wzUe.2uT6gG7Kx0h2v1Y2uT6gG7Kx0h2v1Y2";

  // Create a default admin user
  const admin = await prisma.user.upsert({
    where: { email: "admin@financeai.com" },
    update: {},
    create: {
      email: "admin@financeai.com",
      passwordHash: passwordHash,
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
      isVerified: true,
    },
  });

  // Create a default user
  const user = await prisma.user.upsert({
    where: { email: "user@financeai.com" },
    update: {},
    create: {
      email: "user@financeai.com",
      passwordHash: passwordHash,
      firstName: "John",
      lastName: "Doe",
      role: "USER",
      isVerified: true,
    },
  });

  console.log(`✅ Seeded default admin: ${admin.email}`);
  console.log(`✅ Seeded default user: ${user.email}`);

  // Clean up existing user metrics to allow re-seeding safely
  console.log("🗑️ Cleaning previous seeded entries for user...");
  await prisma.transaction.deleteMany({ where: { userId: user.id } });
  await prisma.budget.deleteMany({ where: { userId: user.id } });
  await prisma.financialGoal.deleteMany({ where: { userId: user.id } });
  await prisma.account.deleteMany({ where: { userId: user.id } });

  // Seed Accounts for John Doe
  console.log("💳 Seeding accounts...");
  const checking = await prisma.account.create({
    data: {
      userId: user.id,
      name: "Checking Account",
      type: "CHECKING",
      balance: 25000.0,
      institutionName: "HDFC Bank",
    },
  });

  // Seed Budgets for John Doe
  console.log("📊 Seeding budgets...");
  await prisma.budget.createMany({
    data: [
      { userId: user.id, name: "Food & Dining", amount: 5000.0, startDate: new Date("2026-08-01"), endDate: new Date("2026-08-31") },
    ],
  });

  // Seed Goals for John Doe
  console.log("🎯 Seeding financial goals...");
  await prisma.financialGoal.createMany({
    data: [
      { userId: user.id, goalName: "Emergency Fund", targetAmount: 50000.0, currentAmount: 10000.0, targetDate: new Date("2027-08-31") },
    ],
  });

  // Seed Transactions for John Doe
  console.log("💸 Seeding transactions...");
  await prisma.transaction.createMany({
    data: [
      {
        userId: user.id,
        accountId: checking.id,
        amount: 25000.0,
        merchant: "Opening Balance",
        description: "Initial deposit",
        category: "Income",
        transactionType: "INCOME",
        transactionDate: new Date("2026-08-15"),
        esgType: "LOCAL",
      },
    ],
  });

  console.log("🌱 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
