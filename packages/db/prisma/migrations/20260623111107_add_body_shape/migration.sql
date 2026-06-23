-- CreateEnum
CREATE TYPE "BodyShape" AS ENUM ('MALE', 'FEMALE', 'UNSPECIFIED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "bodyShape" "BodyShape" NOT NULL DEFAULT 'UNSPECIFIED';
