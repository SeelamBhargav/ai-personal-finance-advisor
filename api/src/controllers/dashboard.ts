import { Request, Response, NextFunction } from "express";
import { db } from "@finance-ai/database";
import OpenAI from "openai";
import env from "../config/env";
import { AuthenticatedRequest } from "../middlewares/auth";

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

// Helper to ensure default data exists for a user (useful for newly registered users)
const ensureDefaultData = async (userId: string) => {
  const accountsCount = await db.account.count({ where: { userId } });
  if (accountsCount > 0) return;

  console.log(`💡 Initializing default dashboard data for user ${userId}...`);

  const checking = await db.account.create({
    data: {
      userId,
      name: "Checking Account",
      type: "CHECKING",
      balance: 25000.0,
      institutionName: "HDFC Bank",
    },
  });

  const savings = await db.account.create({
    data: {
      userId,
      name: "Savings Account",
      type: "SAVINGS",
      balance: 245670.0,
      institutionName: "SBI Bank",
    },
  });

  const creditCard = await db.account.create({
    data: {
      userId,
      name: "Credit Card",
      type: "CREDIT_CARD",
      balance: -18450.0,
      institutionName: "ICICI Bank",
    },
  });

  await db.budget.createMany({
    data: [
      { userId, name: "Food & Dining", amount: 10000.0, startDate: new Date("2026-08-01"), endDate: new Date("2026-08-31") },
      { userId, name: "Entertainment", amount: 3000.0, startDate: new Date("2026-08-01"), endDate: new Date("2026-08-31") },
      { userId, name: "Bills & Utilities", amount: 15000.0, startDate: new Date("2026-08-01"), endDate: new Date("2026-08-31") },
      { userId, name: "Shopping", amount: 8000.0, startDate: new Date("2026-08-01"), endDate: new Date("2026-08-31") },
    ],
  });

  await db.financialGoal.createMany({
    data: [
      { userId, goalName: "Japan Vacation Trip", targetAmount: 200000.0, currentAmount: 85000.0, targetDate: new Date("2027-05-31") },
      { userId, goalName: "Emergency Contingency Fund", targetAmount: 500000.0, currentAmount: 280000.0, targetDate: new Date("2027-12-31") },
    ],
  });

  await db.debt.createMany({
    data: [
      { userId, name: "HDFC Car Loan", amount: 340000.0, interestRate: 9.5, minimumPayment: 8500.0, dueDate: new Date("2026-09-05") },
      { userId, name: "ICICI Credit Card Outstanding", amount: 80000.0, interestRate: 36.0, minimumPayment: 4000.0, dueDate: new Date("2026-09-10") },
    ],
  });

  await db.transaction.createMany({
    data: [
      { userId, accountId: checking.id, amount: 85000.0, merchant: "Acme Corp Tech", description: "Monthly Salary Credit", category: "Income", transactionType: "INCOME", transactionDate: new Date("2026-08-15"), esgType: "CORPORATE" },
      { userId, accountId: checking.id, amount: 499.0, merchant: "Netflix India", description: "Monthly subscription (Premium 4K)", category: "Entertainment", transactionType: "EXPENSE", transactionDate: new Date("2026-08-17"), esgType: "CORPORATE", isRecurring: true },
      { userId, accountId: checking.id, amount: 850.0, merchant: "Swiggy - Corner House", description: "Desserts and ice creams", category: "Food & Dining", transactionType: "EXPENSE", transactionDate: new Date("2026-08-16"), esgType: "LOCAL" },
      { userId, accountId: checking.id, amount: 1200.0, merchant: "Zomato - Truffles", description: "Dinner with friends", category: "Food & Dining", transactionType: "EXPENSE", transactionDate: new Date("2026-08-12"), esgType: "LOCAL" },
      { userId, accountId: checking.id, amount: 4300.0, merchant: "Amazon Web Services", description: "Personal projects server hosting", category: "Bills & Utilities", transactionType: "EXPENSE", transactionDate: new Date("2026-08-10"), esgType: "CORPORATE", isRecurring: true },
      { userId, accountId: checking.id, amount: 7850.0, merchant: "Zara Retail", description: "Apparel clothing retail", category: "Shopping", transactionType: "EXPENSE", transactionDate: new Date("2026-08-08"), esgType: "CORPORATE", anomalyStatus: "DETECTED" },
      { userId, accountId: checking.id, amount: 1200.0, merchant: "Organic Farmers Market", description: "Fresh locally grown vegetables", category: "Food & Dining", transactionType: "EXPENSE", transactionDate: new Date("2026-08-05"), esgType: "LOCAL" },
      { userId, accountId: checking.id, amount: 350.0, merchant: "Starbucks Coffee", description: "Vanilla latte", category: "Food & Dining", transactionType: "EXPENSE", transactionDate: new Date("2026-08-03"), esgType: "CORPORATE" },
    ],
  });

  await db.recurringPayment.createMany({
    data: [
      { userId, accountId: checking.id, name: "Broadband Connection", amount: 899.0, frequency: "MONTHLY", category: "Bills & Utilities", nextPaymentDate: new Date("2026-09-01"), lastPaymentDate: new Date("2026-08-01"), startDate: new Date("2025-08-01") },
      { userId, accountId: checking.id, name: "Postpaid Mobile Plan", amount: 699.0, frequency: "MONTHLY", category: "Bills & Utilities", nextPaymentDate: new Date("2026-09-03"), lastPaymentDate: new Date("2026-08-03"), startDate: new Date("2025-08-03") },
      { userId, accountId: checking.id, name: "Gym Membership", amount: 2500.0, frequency: "MONTHLY", category: "Entertainment", nextPaymentDate: new Date("2026-09-10"), lastPaymentDate: new Date("2026-08-10"), startDate: new Date("2025-08-10") },
    ],
  });
};

// Fetch dashboard data
export const getDashboardData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    await ensureDefaultData(userId);

    const accounts = await db.account.findMany({ where: { userId, isArchived: false } });
    const transactions = await db.transaction.findMany({
      where: { userId },
      orderBy: { transactionDate: "desc" },
    });
    const budgets = await db.budget.findMany({ where: { userId } });
    const goals = await db.financialGoal.findMany({ where: { userId } });
    const debts = await db.debt.findMany({ where: { userId } });
    const subscriptions = await db.recurringPayment.findMany({ where: { userId } });

    res.status(200).json({
      success: true,
      data: {
        accounts,
        transactions,
        budgets,
        goals,
        debts,
        subscriptions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create a transaction
export const createTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { amount, merchant, category, transactionType, esgType, description, accountId, paymentMethod, status } = req.body;

    if (!amount || !merchant || !category || !transactionType || !accountId) {
      res.status(400).json({ success: false, message: "Missing required fields" });
      return;
    }

    const account = await db.account.findUnique({ where: { id: accountId } });
    if (!account || account.userId !== userId) {
      res.status(404).json({ success: false, message: "Account not found" });
      return;
    }

    const transactionAmount = parseFloat(amount);

    const transaction = await db.$transaction(async (tx) => {
      const created = await tx.transaction.create({
        data: {
          userId,
          accountId,
          amount: transactionAmount,
          merchant,
          category,
          transactionType,
          esgType: esgType || "CORPORATE",
          description: description || "",
          transactionDate: new Date(),
          paymentMethod: paymentMethod || "CASH",
          status: status || "COMPLETED",
        },
      });

      const balanceDelta = transactionType === "INCOME" ? transactionAmount : -transactionAmount;
      const updatedAccount = await tx.account.update({
        where: { id: accountId },
        data: { balance: account.balance + balanceDelta },
      });

      return { created, updatedAccount };
    });

    await db.auditLog.create({
      data: {
        userId,
        action: "TRANSACTION_CREATED",
        details: `Logged ₹${transactionAmount} ${transactionType} at ${merchant}`,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        transaction: transaction.created,
        account: transaction.updatedAccount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create budget
export const createBudget = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { category, limit } = req.body;

    if (!category || limit === undefined) {
      res.status(400).json({ success: false, message: "Missing required fields" });
      return;
    }

    const parsedLimit = parseFloat(limit);

    const existingBudget = await db.budget.findFirst({
      where: { userId, name: category },
    });

    let budget;
    if (existingBudget) {
      budget = await db.budget.update({
        where: { id: existingBudget.id },
        data: { amount: parsedLimit },
      });
    } else {
      budget = await db.budget.create({
        data: {
          userId,
          name: category,
          amount: parsedLimit,
          startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
        },
      });
    }

    res.status(200).json({
      success: true,
      data: budget,
    });
  } catch (error) {
    next(error);
  }
};

// Create goal
export const createGoal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { name, target, current, targetDate } = req.body;

    if (!name || target === undefined) {
      res.status(400).json({ success: false, message: "Missing required fields" });
      return;
    }

    const parsedTarget = parseFloat(target);
    const parsedCurrent = current !== undefined ? parseFloat(current) : 0.0;

    let dateVal = new Date();
    if (targetDate) {
      const parsedDate = Date.parse(targetDate);
      if (!isNaN(parsedDate)) {
        dateVal = new Date(parsedDate);
      } else {
        dateVal = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
      }
    }

    const existingGoal = await db.financialGoal.findFirst({
      where: { userId, goalName: name },
    });

    let goal;
    if (existingGoal) {
      goal = await db.financialGoal.update({
        where: { id: existingGoal.id },
        data: {
          targetAmount: parsedTarget,
          currentAmount: parsedCurrent,
          targetDate: dateVal,
        },
      });
    } else {
      goal = await db.financialGoal.create({
        data: {
          userId,
          goalName: name,
          targetAmount: parsedTarget,
          currentAmount: parsedCurrent,
          targetDate: dateVal,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: goal,
    });
  } catch (error) {
    next(error);
  }
};

// Resolve anomaly
export const resolveAnomaly = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { transactionId, status } = req.body;

    if (!transactionId || !status) {
      res.status(400).json({ success: false, message: "Missing required fields" });
      return;
    }

    const transaction = await db.transaction.findFirst({
      where: { id: transactionId, userId },
    });

    if (!transaction) {
      res.status(404).json({ success: false, message: "Transaction not found" });
      return;
    }

    const updated = await db.transaction.update({
      where: { id: transactionId },
      data: {
        anomalyStatus: status as any,
        merchant: status === "SUSPICIOUS" ? `[FLAGGED] ${transaction.merchant}` : transaction.merchant,
        description: status === "SUSPICIOUS" ? "⚠️ FRAUD REVIEW IN PROGRESS" : transaction.description,
      },
    });

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// Calculate Financial Health Score 2.0
export const getHealthScore = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const accounts = await db.account.findMany({ where: { userId, isArchived: false } });
    const transactions = await db.transaction.findMany({ where: { userId } });
    const budgets = await db.budget.findMany({ where: { userId } });
    const debts = await db.debt.findMany({ where: { userId } });

    // 1. Savings score (income vs expense)
    const income = transactions.filter(t => t.transactionType === "INCOME").reduce((s,t) => s + t.amount, 0);
    const expense = transactions.filter(t => t.transactionType === "EXPENSE").reduce((s,t) => s + t.amount, 0);
    let savingsPct = income > 0 ? ((income - expense) / income) * 100 : 0;
    const savingsScore = Math.max(20, Math.min(100, Math.round(savingsPct <= 0 ? 30 : 40 + savingsPct * 0.6)));

    // 2. Budget adherence score
    let budgetScore = 85;
    if (budgets.length > 0) {
      let totalBudget = budgets.reduce((s,b) => s + b.amount, 0);
      let exceeded = 0;
      budgets.forEach(b => {
        const spent = transactions.filter(t => t.transactionType === "EXPENSE" && t.category === b.name).reduce((s,t) => s + t.amount, 0);
        if (spent > b.amount) exceeded += (spent - b.amount);
      });
      const ratio = totalBudget > 0 ? (exceeded / totalBudget) : 0;
      budgetScore = Math.max(10, Math.round(100 - ratio * 100));
    }

    // 3. Debt EMI to Income score
    let debtScore = 90;
    const emi = debts.reduce((s,d) => s + d.minimumPayment, 0);
    if (emi > 0 && income > 0) {
      const debtRatio = emi / (income / 12); // monthly emi relative to monthly income
      debtScore = Math.max(10, Math.round(100 - debtRatio * 150));
    } else if (emi > 0) {
      debtScore = 40; // No recorded income but has EMI debt burden
    }

    // 4. Emergency fund score (checks checking/savings covers average expenses)
    const liquidAssets = accounts.filter(a => a.type === "CHECKING" || a.type === "SAVINGS").reduce((s,a) => s + a.balance, 0);
    const monthlyAvgExp = expense > 0 ? expense / 3 : 15000; // default average monthly expense
    const coverageMonths = monthlyAvgExp > 0 ? liquidAssets / monthlyAvgExp : 0;
    const emergencyScore = Math.max(10, Math.min(100, Math.round(coverageMonths >= 6 ? 100 : 30 + coverageMonths * 11.6)));

    // 5. Investment diversification score
    const totalAssets = accounts.filter(a => a.type !== "CREDIT_CARD").reduce((s,a) => s + a.balance, 0);
    const investments = accounts.filter(a => a.type === "INVESTMENT").reduce((s,a) => s + a.balance, 0);
    const investmentRatio = totalAssets > 0 ? (investments / totalAssets) : 0;
    const investmentScore = Math.max(30, Math.min(100, Math.round(investmentRatio >= 0.3 ? 95 : 40 + investmentRatio * 180)));

    // 6. Spending index (discretionary shopping/dining vs essential bill expenses)
    const discretionary = transactions.filter(t => t.transactionType === "EXPENSE" && (t.category === "Shopping" || t.category === "Entertainment")).reduce((s,t) => s + t.amount, 0);
    const spendingScore = expense > 0 ? Math.max(30, Math.round(100 - (discretionary / expense) * 80)) : 90;

    // Weighted Overall Score
    const totalScore = Math.round(
      savingsScore * 0.20 +
      budgetScore * 0.20 +
      debtScore * 0.15 +
      emergencyScore * 0.20 +
      investmentScore * 0.15 +
      spendingScore * 0.10
    );

    // Dynamic improvement suggestions
    const recommendations = [];
    if (emergencyScore < 75) {
      recommendations.push({
        area: "Emergency Fund",
        tip: `Your cash savings cover ${coverageMonths.toFixed(1)} months of expenses. Aim to accumulate ₹${Math.round(monthlyAvgExp * 6 - liquidAssets).toLocaleString("en-IN")} more to cover a full 6 months.`,
      });
    }
    if (budgetScore < 80) {
      recommendations.push({
        area: "Budget Adherence",
        tip: "You have exceeded some category caps. Set limits on discretionary shopping and diner plans to avoid budget leakage.",
      });
    }
    if (debtScore < 70) {
      recommendations.push({
        area: "Debt Liabilities",
        tip: "Your credit liabilities EMI matches a high percentage of your income. Pay off outstanding credit card balances immediately to restore headroom.",
      });
    }
    if (investmentScore < 60) {
      recommendations.push({
        area: "Investment Portfolio",
        tip: "Consider moving a portion of your idle cash deposits into diversified SIP mutual funds or fixed deposits for better compound yields.",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        score: totalScore,
        breakdown: {
          savings: savingsScore,
          budget: budgetScore,
          debt: debtScore,
          emergency: emergencyScore,
          investment: investmentScore,
          spending: spendingScore,
        },
        recommendations,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Generate data-driven AI Insights
export const getAIInsights = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const transactions = await db.transaction.findMany({ where: { userId } });
    const budgets = await db.budget.findMany({ where: { userId } });
    const goals = await db.financialGoal.findMany({ where: { userId } });
    const debts = await db.debt.findMany({ where: { userId } });
    const subscriptions = await db.recurringPayment.findMany({ where: { userId } });

    const insights = [];

    // 1. Analyze Dining Expenses
    const diningTxs = transactions.filter(t => t.category === "Food & Dining" && t.transactionType === "EXPENSE");
    const diningTotal = diningTxs.reduce((sum, t) => sum + t.amount, 0);
    if (diningTotal > 5000) {
      insights.push({
        id: "ins_dining",
        category: "SPENDING",
        severity: "WARNING",
        title: "High Dining Expenditure Detected",
        description: `You spent ₹${diningTotal.toLocaleString("en-IN")} on Food & Dining. Cooking more meals at home could save up to ₹2,500/month.`,
      });
    }

    // 2. Budget status checks
    budgets.forEach((b) => {
      const spent = transactions
        .filter(t => t.transactionType === "EXPENSE" && t.category === b.name)
        .reduce((s,t) => s + t.amount, 0);

      if (spent >= b.amount) {
        insights.push({
          id: `ins_budget_exc_${b.id}`,
          category: "BUDGET",
          severity: "CRITICAL",
          title: `Budget Limit Exceeded: ${b.name}`,
          description: `You spent ₹${spent.toLocaleString("en-IN")} out of your ₹${b.amount.toLocaleString("en-IN")} cap. Stop discretionary spend in this category.`,
        });
      } else if (spent >= b.amount * 0.8) {
        insights.push({
          id: `ins_budget_warn_${b.id}`,
          category: "BUDGET",
          severity: "WARNING",
          title: `Budget Near Limit: ${b.name}`,
          description: `You have consumed ${Math.round((spent/b.amount)*100)}% of your ₹${b.amount.toLocaleString("en-IN")} budget. Tread carefully.`,
        });
      }
    });

    // 3. Goal status at risk checks
    goals.forEach((g) => {
      const targetDateObj = new Date(g.targetDate);
      const now = new Date();
      const months = (targetDateObj.getFullYear() - now.getFullYear()) * 12 + (targetDateObj.getMonth() - now.getMonth());
      const remaining = g.targetAmount - g.currentAmount;
      if (remaining > 0 && months > 0) {
        const required = remaining / months;
        const capacity = 15000; // estimated mock capacity
        if (required > capacity) {
          insights.push({
            id: `ins_goal_${g.id}`,
            category: "GOAL",
            severity: "WARNING",
            title: `Goal Target at Risk: ${g.goalName}`,
            description: `Requires ₹${Math.round(required).toLocaleString("en-IN")}/mo to hit deadline, which exceeds saving capacity. Extend deadline or increase savings.`,
          });
        }
      }
    });

    // 4. Anomaly detected checks
    const anomalies = transactions.filter(t => t.anomalyStatus === "DETECTED");
    anomalies.forEach((a) => {
      insights.push({
        id: `ins_anomaly_${a.id}`,
        category: "ANOMALY",
        severity: "CRITICAL",
        title: "Unusual Transaction Flagged",
        description: `Unusual transaction of ₹${a.amount.toLocaleString("en-IN")} at ${a.merchant} on ${a.transactionDate.toISOString().split("T")[0]}. Please audit in dashboard.`,
      });
    });

    // 5. Subscription audits
    const CCSubscriptions = subscriptions.filter(s => s.status === "ACTIVE" && s.amount > 1000);
    if (CCSubscriptions.length > 0) {
      insights.push({
        id: "ins_sub_saving",
        category: "SAVINGS",
        severity: "INFO",
        title: "Subscription Overhead Audit",
        description: "You have active recurring bill profiles. Revoking unused streaming or gym subscriptions could free up ₹2,000 in monthly cash flow.",
      });
    }

    res.status(200).json({
      success: true,
      data: insights,
    });
  } catch (error) {
    next(error);
  }
};

// Scan receipt (does not save, returns parsed verification structure)
export const scanReceipt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    // Default mock response returned for verification editing
    const extractedData = {
      merchant: "Amazon India",
      amount: 2499.0,
      tax: 180.0,
      category: "Shopping",
      paymentMethod: "CREDIT_CARD",
      invoiceNumber: "INV-2026-" + Math.floor(100000 + Math.random() * 900000),
      description: "Kindle e-Book & Charger Adapter",
    };

    res.status(200).json({
      success: true,
      data: extractedData,
    });
  } catch (error) {
    next(error);
  }
};

// AI Copilot with Safe Action structure
export const chatCopilot = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { message, isRoasterMode, history = [] } = req.body;

    if (!message) {
      res.status(400).json({ success: false, message: "Message is required" });
      return;
    }

    const userDetails = await db.user.findUnique({ where: { id: userId } });
    const accounts = await db.account.findMany({ where: { userId, isArchived: false } });
    const transactions = await db.transaction.findMany({ where: { userId }, orderBy: { transactionDate: "desc" }, take: 10 });
    const budgets = await db.budget.findMany({ where: { userId } });
    const goals = await db.financialGoal.findMany({ where: { userId } });

    const accountsCtx = accounts.map(a => `${a.name}: balance ₹${a.balance}`).join(", ");
    const budgetsCtx = budgets.map(b => `${b.name}: ₹${b.amount}`).join(", ");
    const goalsCtx = goals.map(g => `${g.goalName}: target ₹${g.targetAmount}, current ₹${g.currentAmount}`).join(", ");
    const txCtx = transactions.map(t => `${t.merchant}: ₹${t.amount} (${t.transactionType})`).join(", ");

    const systemInstruction = `You are the FinanceAI Copilot, an advanced personal wealth advisor.
User name: ${userDetails?.firstName || "User"}.
ACCOUNTS: ${accountsCtx || "None"}.
BUDGETS: ${budgetsCtx || "None"}.
GOALS: ${goalsCtx || "None"}.
RECENT TRANSACTIONS: ${txCtx || "None"}.

${isRoasterMode ? "ROASTER MODE ACTIVATED: Be highly sarcastic, critical, and funny about the user's spending (Swiggy, Netflix, shopping, etc.) while giving valid recommendations." : "Be supportive, encouraging, and clear."}

CRITICAL RULES FOR DATABASE MUTATIONS:
You CANNOT execute budget creations or log transactions directly in the database. Instead, if the user asks you to:
1. Create or set a budget limit (e.g. "create a food budget of 8000"):
   Append this tag EXACTLY at the end of your response to request a frontend confirmation modal:
   [ACTION: CREATE_BUDGET {"category": "Food & Dining", "limit": 8000}]
2. Add a manual transaction (e.g. "I spent 400 at Starbucks"):
   Find the checking account ID. The user's Checking account ID is "${accounts.find(a=>a.type==="CHECKING")?.id || ""}". Append:
   [ACTION: ADD_TRANSACTION {"merchant": "Starbucks", "amount": 400, "category": "Food & Dining", "type": "EXPENSE"}]

Respond in Markdown. Under 3 sentences.`;

    const formattedMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemInstruction },
      ...history.slice(-6).map((h: any) => ({
        role: h.role === "user" ? ("user" as const) : ("assistant" as const),
        content: h.content,
      })),
      { role: "user", content: message },
    ];

    let reply = "";
    let actionTriggered = null;

    if (env.OPENAI_API_KEY && env.OPENAI_API_KEY !== "your-openai-api-key-here" && env.OPENAI_API_KEY !== "mock-openai-key") {
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: formattedMessages,
          temperature: isRoasterMode ? 0.85 : 0.4,
          max_tokens: 250,
        });
        reply = response.choices[0]?.message?.content || "";
      } catch (err) {
        console.error("OpenAI failed, using fallback rule processor.");
      }
    }

    if (!reply) {
      const msgLower = message.toLowerCase();
      if (isRoasterMode) {
        reply = `Oh great. You want me to calculate things for you. With an account balance of ₹${accounts[0]?.balance || 0}, you shouldn't even be asking me questions. Cook something at home instead of scrolling food delivery apps!`;
      } else {
        if (msgLower.includes("budget") && (msgLower.includes("food") || msgLower.includes("dining"))) {
          reply = "I can set a Food & Dining budget of ₹6,000 for you. Please confirm below: [ACTION: CREATE_BUDGET {\"category\": \"Food & Dining\", \"limit\": 6000}]";
        } else if (msgLower.includes("starbucks") || msgLower.includes("spend")) {
          reply = "I can log a Starbucks Coffee expense of ₹350. Please confirm below: [ACTION: ADD_TRANSACTION {\"merchant\": \"Starbucks Coffee\", \"amount\": 350, \"category\": \"Food & Dining\", \"type\": \"EXPENSE\"}]";
        } else {
          reply = "I am ready to advise you. You can ask me to log expenses, check goals, or set budget ceilings.";
        }
      }
    }

    const actionRegex = /\[ACTION:\s*([A-Z_]+)\s*(\{.*?\})\]/;
    const match = reply.match(actionRegex);
    if (match) {
      const actionType = match[1];
      const actionArgsStr = match[2];
      try {
        const args = JSON.parse(actionArgsStr);
        actionTriggered = { type: actionType, args };
        reply = reply.replace(actionRegex, "").trim();
      } catch (e) {
        console.error("Failed to parse action json args");
      }
    }

    // Save logs to conversation
    let conversation = await db.aIConversation.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } });
    if (!conversation) {
      conversation = await db.aIConversation.create({ data: { userId, title: "FinanceAI Advisory" } });
    }

    await db.aIMessage.create({ data: { conversationId: conversation.id, role: "user", content: message } });
    await db.aIMessage.create({ data: { conversationId: conversation.id, role: "assistant", content: reply } });

    res.status(200).json({
      success: true,
      data: {
        reply,
        action: actionTriggered, // Client displays confirmation dialog, and ONLY calls backend on confirmation!
      },
    });
  } catch (error) {
    next(error);
  }
};

// Bulk Categorize Transactions
export const bulkCategorize = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { ids, category } = req.body;
    if (!ids || !Array.isArray(ids) || !category) {
      res.status(400).json({ success: false, message: "Invalid parameters" });
      return;
    }

    await db.transaction.updateMany({
      where: { id: { in: ids }, userId },
      data: { category },
    });

    res.status(200).json({ success: true, message: `Successfully categorized ${ids.length} transactions` });
  } catch (error) {
    next(error);
  }
};

// Bulk Delete Transactions
export const bulkDelete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      res.status(400).json({ success: false, message: "Missing transaction IDs" });
      return;
    }

    // Safely recalculate account balances before deleting transactions
    const txs = await db.transaction.findMany({
      where: { id: { in: ids }, userId },
    });

    await db.$transaction(async (tx) => {
      // Revert balances
      for (const t of txs) {
        const balanceDelta = t.transactionType === "INCOME" ? -t.amount : t.amount;
        await tx.account.update({
          where: { id: t.accountId },
          data: { balance: { increment: balanceDelta } },
        });
      }

      await tx.transaction.deleteMany({
        where: { id: { in: ids }, userId },
      });
    });

    res.status(200).json({ success: true, message: `Successfully deleted ${ids.length} transactions` });
  } catch (error) {
    next(error);
  }
};

// Fetch user audit logs
export const getAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const logs = await db.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};
