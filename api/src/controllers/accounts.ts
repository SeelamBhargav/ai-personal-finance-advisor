import { Request, Response, NextFunction } from "express";
import { db } from "@finance-ai/database";
import { CreateAccountInputSchema } from "@finance-ai/types";
import { AuthenticatedRequest } from "../middlewares/auth";

// Fetch all accounts with dynamic stats
export const getAccounts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const includeArchived = req.query.includeArchived === "true";

    const accounts = await db.account.findMany({
      where: {
        userId,
        ...(includeArchived ? {} : { isArchived: false }),
      },
      include: {
        transactions: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    // Compute dynamic stats per account
    const accountsWithStats = accounts.map((acc) => {
      const income = acc.transactions
        .filter((t) => t.transactionType === "INCOME" || t.transactionType === "REFUND")
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = acc.transactions
        .filter((t) => t.transactionType === "EXPENSE" || t.transactionType === "TRANSFER")
        .reduce((sum, t) => sum + t.amount, 0);

      // Simple available balance logic: Credit Card balance is credit limit + balance (represented as negative)
      // For checking/savings, available balance is equal to balance.
      const availableBalance = acc.type === "CREDIT_CARD" ? Math.max(0, 100000 + acc.balance) : acc.balance;

      return {
        id: acc.id,
        name: acc.name,
        type: acc.type,
        balance: acc.balance,
        availableBalance,
        currency: acc.currency,
        institutionName: acc.institutionName,
        isArchived: acc.isArchived,
        income,
        expenses,
        createdAt: acc.createdAt,
        updatedAt: acc.updatedAt,
      };
    });

    res.status(200).json({
      success: true,
      data: accountsWithStats,
    });
  } catch (error) {
    next(error);
  }
};

// Create a new financial account
export const createAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const validated = CreateAccountInputSchema.parse(req.body);

    const account = await db.account.create({
      data: {
        userId,
        name: validated.name,
        type: validated.type,
        balance: validated.balance,
        currency: validated.currency,
        institutionName: validated.institutionName,
      },
    });

    // Write Audit Log
    await db.auditLog.create({
      data: {
        userId,
        action: "ACCOUNT_CREATED",
        details: `Created new ${validated.type} account "${validated.name}" at ${validated.institutionName}`,
      },
    });

    res.status(201).json({
      success: true,
      data: account,
    });
  } catch (error) {
    next(error);
  }
};

// Update existing account
export const updateAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { id } = req.params;
    const { name, type, balance, institutionName, isArchived } = req.body;

    const existingAccount = await db.account.findUnique({
      where: { id },
    });

    if (!existingAccount || existingAccount.userId !== userId) {
      res.status(404).json({ success: false, message: "Account not found" });
      return;
    }

    const updatedAccount = await db.account.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existingAccount.name,
        type: type !== undefined ? type : existingAccount.type,
        balance: balance !== undefined ? parseFloat(balance) : existingAccount.balance,
        institutionName: institutionName !== undefined ? institutionName : existingAccount.institutionName,
        isArchived: isArchived !== undefined ? isArchived : existingAccount.isArchived,
      },
    });

    // Write Audit Log
    await db.auditLog.create({
      data: {
        userId,
        action: isArchived === true ? "ACCOUNT_ARCHIVED" : "ACCOUNT_UPDATED",
        details: `Updated account ID ${id}: ${name || existingAccount.name}`,
      },
    });

    res.status(200).json({
      success: true,
      data: updatedAccount,
    });
  } catch (error) {
    next(error);
  }
};

// Delete account
export const deleteAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { id } = req.params;

    const existingAccount = await db.account.findUnique({
      where: { id },
    });

    if (!existingAccount || existingAccount.userId !== userId) {
      res.status(404).json({ success: false, message: "Account not found" });
      return;
    }

    await db.account.delete({
      where: { id },
    });

    // Write Audit Log
    await db.auditLog.create({
      data: {
        userId,
        action: "ACCOUNT_DELETED",
        details: `Deleted account "${existingAccount.name}"`,
      },
    });

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
