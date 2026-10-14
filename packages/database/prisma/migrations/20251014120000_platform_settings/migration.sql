CREATE TABLE IF NOT EXISTS "platform_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("key")
);

INSERT INTO "platform_settings" ("key", "value", "updatedAt")
VALUES ('loan_flat_interest_rate', '0.03', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
