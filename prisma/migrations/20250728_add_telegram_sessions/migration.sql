-- CreateTable for Telegram bot sessions
CREATE TABLE IF NOT EXISTS "telegram_sessions" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "telegram_sessions_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "telegram_sessions_updated_at_idx" ON "telegram_sessions"("updated_at");