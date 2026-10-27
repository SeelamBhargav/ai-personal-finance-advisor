import { z } from "zod";

// Auth Schemas & Types
export const RegisterInputSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});
export type RegisterInput = z.infer<typeof RegisterInputSchema>;

export const LoginInputSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof LoginInputSchema>;

export const PasswordResetRequestInputSchema = z.object({
  email: z.string().email("Invalid email address"),
});
export type PasswordResetRequestInput = z.infer<typeof PasswordResetRequestInputSchema>;

export const PasswordResetInputSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});
export type PasswordResetInput = z.infer<typeof PasswordResetInputSchema>;

// Account Types
export type AccountType = "CHECKING" | "SAVINGS" | "CREDIT_CARD" | "INVESTMENT" | "DEBT";

export const CreateAccountInputSchema = z.object({
  name: z.string().min(1, "Account name is required"),
  type: z.enum(["CHECKING", "SAVINGS", "CREDIT_CARD", "INVESTMENT", "DEBT"]),
  balance: z.number().default(0.0),
  currency: z.string().default("INR"),
  institutionName: z.string().min(1, "Institution name is required"),
});
export type CreateAccountInput = z.infer<typeof CreateAccountInputSchema>;

// Transaction Types
export type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER" | "REFUND";

export const CreateTransactionInputSchema = z.object({
  accountId: z.string().uuid("Invalid account ID"),
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().default("INR"),
  merchant: z.string().min(1, "Merchant is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  subcategory: z.string().optional(),
  transactionType: z.enum(["INCOME", "EXPENSE", "TRANSFER", "REFUND"]),
  transactionDate: z.string().or(z.date()).transform((val) => new Date(val)),
  isRecurring: z.boolean().default(false),
});
export type CreateTransactionInput = z.infer<typeof CreateTransactionInputSchema>;

export const UpdateTransactionInputSchema = CreateTransactionInputSchema.partial();
export type UpdateTransactionInput = z.infer<typeof UpdateTransactionInputSchema>;

// Budget Schemas
export const CreateBudgetInputSchema = z.object({
  name: z.string().min(1, "Budget name is required"),
  amount: z.number().positive("Amount must be positive"),
  period: z.enum(["WEEKLY", "MONTHLY", "CUSTOM"]).default("MONTHLY"),
  startDate: z.string().or(z.date()).transform((val) => new Date(val)),
  endDate: z.string().or(z.date()).transform((val) => new Date(val)),
  categories: z.array(
    z.object({
      category: z.string().min(1, "Category is required"),
      amount: z.number().positive("Category amount must be positive"),
    })
  ).min(1, "At least one category budget is required"),
});
export type CreateBudgetInput = z.infer<typeof CreateBudgetInputSchema>;

// Goal Schemas
export const CreateGoalInputSchema = z.object({
  goalName: z.string().min(1, "Goal name is required"),
  targetAmount: z.number().positive("Target amount must be positive"),
  currentAmount: z.number().nonnegative().default(0.0),
  targetDate: z.string().or(z.date()).transform((val) => new Date(val)),
  monthlyContribution: z.number().nonnegative().default(0.0),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
});
export type CreateGoalInput = z.infer<typeof CreateGoalInputSchema>;

// What-if Simulation Types
export const SimulationInputSchema = z.object({
  scenarioType: z.string(), // e.g. "BUY_ITEM", "SALARY_CHANGE", "SAVINGS_CHANGE", "RENT_CHANGE", "EXPENSE_REDUCTION"
  name: z.string().min(1),
  inputs: z.record(z.any()),
});
export type SimulationInput = z.infer<typeof SimulationInputSchema>;
