/*
  Warnings:

  - Added the required column `free` to the `Disk` table without a default value. This is not possible if the table is not empty.
  - Added the required column `used` to the `Disk` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Disk" ADD COLUMN     "free" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "used" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "Gpu" ADD COLUMN     "memory" DOUBLE PRECISION,
ADD COLUMN     "usage" DOUBLE PRECISION;
