/*
  Warnings:

  - You are about to drop the `app_settings` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "app_settings";

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "Setting_key_key" ON "Setting"("key");
