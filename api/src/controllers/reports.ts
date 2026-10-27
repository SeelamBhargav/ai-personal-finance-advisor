import { Request, Response, NextFunction } from "express";
import { db } from "@finance-ai/database";
import { AuthenticatedRequest } from "../middlewares/auth";

export const generateReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { type = "expense", startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate as string) : new Date();

    // Fetch user details
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, email: true },
    });

    let reportData: any = {};

    if (type === "expense" || type === "income") {
      const txType = type === "expense" ? "EXPENSE" : "INCOME";
      const transactions = await db.transaction.findMany({
        where: {
          userId,
          transactionType: txType,
          transactionDate: { gte: start, lte: end },
        },
        include: { account: true },
        orderBy: { transactionDate: "desc" },
      });

      const total = transactions.reduce((sum, t) => sum + t.amount, 0);

      // Group by category
      const categoryMap: Record<string, number> = {};
      transactions.forEach((t) => {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
      });

      const categories = Object.keys(categoryMap).map((name) => ({
        name,
        amount: categoryMap[name],
        percentage: total > 0 ? parseFloat(((categoryMap[name] / total) * 100).toFixed(2)) : 0,
      }));

      reportData = {
        title: `${type === "expense" ? "Expense" : "Income"} Statement Report`,
        type,
        generatedAt: new Date().toISOString(),
        dateRange: { start, end },
        user,
        summary: {
          total,
          transactionCount: transactions.length,
          averageAmount: transactions.length > 0 ? parseFloat((total / transactions.length).toFixed(2)) : 0,
        },
        categories,
        transactions: transactions.map((t) => ({
          id: t.id,
          date: t.transactionDate.toISOString().split("T")[0],
          merchant: t.merchant,
          category: t.category,
          accountName: t.account.name,
          amount: t.amount,
          paymentMethod: t.paymentMethod,
          status: t.status,
        })),
      };
    } else if (type === "budget") {
      const budgets = await db.budget.findMany({
        where: { userId },
        include: { categories: true },
      });

      const transactions = await db.transaction.findMany({
        where: {
          userId,
          transactionType: "EXPENSE",
          transactionDate: { gte: start, lte: end },
        },
      });

      const budgetOverview = budgets.map((b) => {
        // Calculate spent for this budget category
        const spent = transactions
          .filter((t) => t.category === b.name)
          .reduce((sum, t) => sum + t.amount, 0);

        const percentageUsed = b.amount > 0 ? parseFloat(((spent / b.amount) * 100).toFixed(2)) : 0;
        const status = percentageUsed >= 100 ? "EXCEEDED" : percentageUsed >= 80 ? "WARNING" : "ON_TRACK";

        return {
          id: b.id,
          name: b.name,
          limit: b.amount,
          spent,
          percentageUsed,
          status,
        };
      });

      const totalLimit = budgetOverview.reduce((sum, b) => sum + b.limit, 0);
      const totalSpent = budgetOverview.reduce((sum, b) => sum + b.spent, 0);

      reportData = {
        title: "Budget Performance Audit Report",
        type: "budget",
        generatedAt: new Date().toISOString(),
        dateRange: { start, end },
        user,
        summary: {
          totalLimit,
          totalSpent,
          overallPercentage: totalLimit > 0 ? parseFloat(((totalSpent / totalLimit) * 100).toFixed(2)) : 0,
          exceededCount: budgetOverview.filter((b) => b.status === "EXCEEDED").length,
          warningCount: budgetOverview.filter((b) => b.status === "WARNING").length,
        },
        budgets: budgetOverview,
      };
    } else if (type === "net_worth" || type === "debt") {
      const accounts = await db.account.findMany({ where: { userId } });
      const debts = await db.debt.findMany({ where: { userId } });

      const totalAssets = accounts
        .filter((a) => a.type !== "CREDIT_CARD" && a.type !== "DEBT")
        .reduce((sum, a) => sum + a.balance, 0);

      const creditCardDebt = accounts
        .filter((a) => a.type === "CREDIT_CARD")
        .reduce((sum, a) => sum + Math.abs(a.balance), 0);

      const activeLoans = debts
        .filter((d) => d.status === "ACTIVE")
        .reduce((sum, d) => sum + d.amount, 0);

      const totalLiabilities = creditCardDebt + activeLoans;
      const netWorth = totalAssets - totalLiabilities;

      reportData = {
        title: type === "net_worth" ? "Net Worth Audit Statement" : "Liabilities & Payoff Audit",
        type,
        generatedAt: new Date().toISOString(),
        user,
        summary: {
          totalAssets,
          totalLiabilities,
          netWorth,
          debtToAssetRatio: totalAssets > 0 ? parseFloat(((totalLiabilities / totalAssets) * 100).toFixed(2)) : 0,
        },
        accounts: accounts.map((a) => ({
          name: a.name,
          institution: a.institutionName,
          type: a.type,
          balance: a.balance,
        })),
        debts: debts.map((d) => ({
          name: d.name,
          balance: d.amount,
          rate: d.interestRate,
          emi: d.minimumPayment,
          dueDate: d.dueDate.toISOString().split("T")[0],
          status: d.status,
        })),
      };
    } else if (type === "investment") {
      const accounts = await db.account.findMany({
        where: { userId, type: "INVESTMENT" },
        include: { investments: true },
      });

      const allInvestments = accounts.flatMap((a) => a.investments);
      const totalPortfolioValue = allInvestments.reduce((sum, inv) => sum + inv.currentPrice * inv.quantity, 0);
      const totalCostBasis = allInvestments.reduce((sum, inv) => sum + inv.purchasePrice * inv.quantity, 0);
      const totalReturn = totalPortfolioValue - totalCostBasis;
      const cagr = totalCostBasis > 0 ? parseFloat(((totalReturn / totalCostBasis) * 100).toFixed(2)) : 0;

      // Asset Allocation Split
      const allocationMap: Record<string, number> = {};
      allInvestments.forEach((inv) => {
        const val = inv.currentPrice * inv.quantity;
        allocationMap[inv.type] = (allocationMap[inv.type] || 0) + val;
      });

      const assetAllocation = Object.keys(allocationMap).map((name) => ({
        name,
        value: Math.round(allocationMap[name]),
        percentage: totalPortfolioValue > 0 ? parseFloat(((allocationMap[name] / totalPortfolioValue) * 100).toFixed(2)) : 0,
      }));

      reportData = {
        title: "Wealth Investment Portfolio Audit",
        type: "investment",
        generatedAt: new Date().toISOString(),
        user,
        summary: {
          totalValue: totalPortfolioValue,
          costBasis: totalCostBasis,
          totalReturn,
          returnPercentage: cagr,
        },
        assetAllocation,
        holdings: allInvestments.map((inv) => ({
          name: inv.name,
          type: inv.type,
          quantity: inv.quantity,
          buyPrice: inv.purchasePrice,
          marketPrice: inv.currentPrice,
          value: inv.currentPrice * inv.quantity,
          returns: (inv.currentPrice - inv.purchasePrice) * inv.quantity,
          returnPct: inv.purchasePrice > 0 ? parseFloat((((inv.currentPrice - inv.purchasePrice) / inv.purchasePrice) * 100).toFixed(2)) : 0,
        })),
      };
    } else {
      res.status(400).json({ success: false, message: `Invalid report type: ${type}` });
      return;
    }

    res.status(200).json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    next(error);
  }
};
