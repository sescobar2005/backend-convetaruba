-- CreateEnum
CREATE TYPE "StaffPosition" AS ENUM ('VETERINARIAN', 'ASSISTANT', 'RECEPTIONIST', 'OTHER');

-- CreateTable
CREATE TABLE "Staff" (
    "idStaff" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "staffNumber" TEXT NOT NULL,
    "position" "StaffPosition" NOT NULL,
    "specialty" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("idStaff")
);

-- CreateIndex
CREATE UNIQUE INDEX "Staff_userId_key" ON "Staff"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_staffNumber_key" ON "Staff"("staffNumber");

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("idUser") ON DELETE RESTRICT ON UPDATE CASCADE;
