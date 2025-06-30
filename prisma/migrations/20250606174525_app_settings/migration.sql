-- CreateTable
CREATE TABLE "app_settings" (
    "lastSeenHistoryId" INTEGER NOT NULL DEFAULT 0
);

-- CreateIndex
CREATE UNIQUE INDEX "app_settings_lastSeenHistoryId_key" ON "app_settings"("lastSeenHistoryId");
