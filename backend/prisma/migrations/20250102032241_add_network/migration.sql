/*
  Warnings:

  - You are about to drop the column `networkUsage` on the `SystemInfo` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SystemInfo" DROP COLUMN "networkUsage";

-- CreateTable
CREATE TABLE "Network" (
    "id" SERIAL NOT NULL,
    "interface" TEXT NOT NULL,
    "rxSpeed" DOUBLE PRECISION NOT NULL,
    "txSpeed" DOUBLE PRECISION NOT NULL,
    "systemInfoId" INTEGER NOT NULL,

    CONSTRAINT "Network_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Network" ADD CONSTRAINT "Network_systemInfoId_fkey" FOREIGN KEY ("systemInfoId") REFERENCES "SystemInfo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
