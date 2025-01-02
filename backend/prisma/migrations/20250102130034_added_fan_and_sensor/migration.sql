-- CreateEnum
CREATE TYPE "Mode" AS ENUM ('DEFAULT', 'ATEMP', 'ACLOCK', 'MANUAL');

-- CreateTable
CREATE TABLE "Cooler" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cooler_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoolerData" (
    "id" SERIAL NOT NULL,
    "coolerId" INTEGER NOT NULL,
    "mode" "Mode" NOT NULL DEFAULT 'DEFAULT',
    "speed" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoolerData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnvTemp" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnvTemp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnvTempData" (
    "id" SERIAL NOT NULL,
    "envTempId" INTEGER NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "humidity" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnvTempData_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CoolerData" ADD CONSTRAINT "CoolerData_coolerId_fkey" FOREIGN KEY ("coolerId") REFERENCES "Cooler"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvTempData" ADD CONSTRAINT "EnvTempData_envTempId_fkey" FOREIGN KEY ("envTempId") REFERENCES "EnvTemp"("id") ON DELETE CASCADE ON UPDATE CASCADE;
