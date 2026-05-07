/*
  Warnings:

  - You are about to drop the column `name` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `first_name` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "name",
ADD COLUMN     "first_name" TEXT NOT NULL,
ADD COLUMN     "last_name" TEXT,
ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_slug_key" ON "users"("slug");
