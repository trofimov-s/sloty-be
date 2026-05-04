-- CreateTable
CREATE TABLE "refresh_rokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_rokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "refresh_rokens_token_key" ON "refresh_rokens"("token");

-- CreateIndex
CREATE INDEX "refresh_rokens_user_id_idx" ON "refresh_rokens"("user_id");

-- AddForeignKey
ALTER TABLE "refresh_rokens" ADD CONSTRAINT "refresh_rokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
