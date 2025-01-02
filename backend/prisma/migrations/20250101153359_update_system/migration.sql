/*
  Warnings:

  - Added the required column `isCharging` to the `SystemInfo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `networkUsage` to the `SystemInfo` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Disk" DROP CONSTRAINT "Disk_systemInfoId_fkey";

-- DropForeignKey
ALTER TABLE "Gpu" DROP CONSTRAINT "Gpu_systemInfoId_fkey";

-- AlterTable
ALTER TABLE "SystemInfo" ADD COLUMN     "batteryLevel" DOUBLE PRECISION,
ADD COLUMN     "batteryVoltage" DOUBLE PRECISION,
ADD COLUMN     "isCharging" BOOLEAN NOT NULL,
ADD COLUMN     "networkUsage" DOUBLE PRECISION NOT NULL;

-- AddForeignKey
ALTER TABLE "Disk" ADD CONSTRAINT "Disk_systemInfoId_fkey" FOREIGN KEY ("systemInfoId") REFERENCES "SystemInfo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gpu" ADD CONSTRAINT "Gpu_systemInfoId_fkey" FOREIGN KEY ("systemInfoId") REFERENCES "SystemInfo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
