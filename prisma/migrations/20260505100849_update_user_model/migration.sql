/*
  Warnings:

  - A unique constraint covering the columns `[telegram]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[instagram]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatar_url" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "instagram" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "telegram" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_telegram_key" ON "users"("telegram");

-- CreateIndex
CREATE UNIQUE INDEX "users_instagram_key" ON "users"("instagram");
