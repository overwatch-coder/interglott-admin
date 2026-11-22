ALTER TABLE "profiles" ADD COLUMN "referral_code" VARCHAR(20);
CREATE UNIQUE INDEX "profiles_referral_code_key" ON "profiles"("referral_code");

CREATE TABLE "progress_awards" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "award_key" VARCHAR(200) NOT NULL,
  "amount" INTEGER NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "progress_awards_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "progress_awards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "progress_awards_user_id_award_key_key" ON "progress_awards"("user_id", "award_key");
CREATE INDEX "progress_awards_user_id_created_at_idx" ON "progress_awards"("user_id", "created_at" DESC);

CREATE TABLE "assessment_attempts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "assessment_key" VARCHAR(120) NOT NULL,
  "state" JSONB NOT NULL,
  "completed_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "assessment_attempts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "assessment_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "assessment_attempts_user_id_assessment_key_key" ON "assessment_attempts"("user_id", "assessment_key");
CREATE INDEX "assessment_attempts_user_id_updated_at_idx" ON "assessment_attempts"("user_id", "updated_at" DESC);

CREATE TABLE "referrals" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "referrer_user_id" UUID NOT NULL,
  "referred_user_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "referrals_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "referrals_referrer_user_id_fkey" FOREIGN KEY ("referrer_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "referrals_referred_user_id_fkey" FOREIGN KEY ("referred_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "referrals_referred_user_id_key" ON "referrals"("referred_user_id");
CREATE INDEX "referrals_referrer_user_id_created_at_idx" ON "referrals"("referrer_user_id", "created_at" DESC);
