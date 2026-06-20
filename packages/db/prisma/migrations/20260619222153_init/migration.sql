-- CreateEnum
CREATE TYPE "Units" AS ENUM ('METRIC', 'IMPERIAL');

-- CreateEnum
CREATE TYPE "Drug" AS ENUM ('OZEMPIC', 'WEGOVY', 'MOUNJARO', 'ZEPBOUND', 'RYBELSUS', 'COMPOUNDED_SEMAGLUTIDE', 'COMPOUNDED_TIRZEPATIDE', 'OTHER');

-- CreateEnum
CREATE TYPE "MedicationForm" AS ENUM ('INJECTION', 'ORAL');

-- CreateEnum
CREATE TYPE "ScheduleType" AS ENUM ('WEEKLY', 'DAILY');

-- CreateEnum
CREATE TYPE "InjectionSite" AS ENUM ('ABDOMEN_L', 'ABDOMEN_R', 'THIGH_L', 'THIGH_R', 'ARM_L', 'ARM_R');

-- CreateEnum
CREATE TYPE "WeightUnit" AS ENUM ('KG', 'LB');

-- CreateEnum
CREATE TYPE "SideEffectType" AS ENUM ('NAUSEA', 'CONSTIPATION', 'DIARRHEA', 'FATIGUE', 'REFLUX', 'HEADACHE', 'INJECTION_SITE_REACTION', 'OTHER');

-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('DOSE', 'PILL', 'WEIGH_IN', 'PROTEIN', 'WATER');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "healthSyncEnabled" BOOLEAN NOT NULL DEFAULT false,
    "units" "Units" NOT NULL DEFAULT 'METRIC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "drug" "Drug" NOT NULL,
    "form" "MedicationForm" NOT NULL,
    "scheduleType" "ScheduleType" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "titration_steps" (
    "id" TEXT NOT NULL,
    "medicationId" TEXT NOT NULL,
    "doseMg" DOUBLE PRECISION NOT NULL,
    "order" INTEGER NOT NULL,
    "plannedStartDate" TIMESTAMP(3),
    "actualStartDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "titration_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dose_logs" (
    "id" TEXT NOT NULL,
    "medicationId" TEXT NOT NULL,
    "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "doseMg" DOUBLE PRECISION NOT NULL,
    "injectionSite" "InjectionSite",
    "skipped" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dose_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weight_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weight" DOUBLE PRECISION NOT NULL,
    "unit" "WeightUnit" NOT NULL,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weight_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "side_effect_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "SideEffectType" NOT NULL,
    "severity" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "side_effect_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intake_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "proteinG" DOUBLE PRECISION,
    "waterMl" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "intake_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminders" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "medicationId" TEXT,
    "type" "ReminderType" NOT NULL,
    "schedule" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "medications_userId_active_idx" ON "medications"("userId", "active");

-- CreateIndex
CREATE INDEX "titration_steps_medicationId_order_idx" ON "titration_steps"("medicationId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "titration_steps_medicationId_order_key" ON "titration_steps"("medicationId", "order");

-- CreateIndex
CREATE INDEX "dose_logs_medicationId_takenAt_idx" ON "dose_logs"("medicationId", "takenAt" DESC);

-- CreateIndex
CREATE INDEX "weight_logs_userId_recordedAt_idx" ON "weight_logs"("userId", "recordedAt" DESC);

-- CreateIndex
CREATE INDEX "side_effect_logs_userId_occurredAt_idx" ON "side_effect_logs"("userId", "occurredAt" DESC);

-- CreateIndex
CREATE INDEX "side_effect_logs_userId_type_idx" ON "side_effect_logs"("userId", "type");

-- CreateIndex
CREATE INDEX "intake_logs_userId_date_idx" ON "intake_logs"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "intake_logs_userId_date_key" ON "intake_logs"("userId", "date");

-- CreateIndex
CREATE INDEX "reminders_userId_enabled_idx" ON "reminders"("userId", "enabled");

-- CreateIndex
CREATE INDEX "reminders_medicationId_idx" ON "reminders"("medicationId");

-- AddForeignKey
ALTER TABLE "medications" ADD CONSTRAINT "medications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "titration_steps" ADD CONSTRAINT "titration_steps_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "medications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dose_logs" ADD CONSTRAINT "dose_logs_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "medications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weight_logs" ADD CONSTRAINT "weight_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "side_effect_logs" ADD CONSTRAINT "side_effect_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intake_logs" ADD CONSTRAINT "intake_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "medications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
