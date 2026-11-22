ALTER TABLE "profiles"
  ADD COLUMN "last_credit_bonus_date" VARCHAR(20),
  ADD COLUMN "last_credit_streak_bonus" INTEGER NOT NULL DEFAULT 0;
