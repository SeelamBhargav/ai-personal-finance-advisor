-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "paymentMethod" TEXT DEFAULT 'CASH',
ADD COLUMN     "status" TEXT DEFAULT 'COMPLETED';
