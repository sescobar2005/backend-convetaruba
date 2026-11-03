-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AppointmentHistoryAction" AS ENUM ('CREATED', 'CONFIRMED', 'REJECTED', 'RESCHEDULED', 'STARTED', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'VETERINARIAN_CHANGED', 'END_TIME_CHANGED');

-- CreateEnum
CREATE TYPE "AppointmentBlockReason" AS ENUM ('BREAK', 'VACATION', 'MEETING', 'PERMISSION', 'OTHER');

-- CreateEnum
CREATE TYPE "WeekDay" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateTable
CREATE TABLE "Appointment" (
    "idAppointment" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "createdByUserId" UUID NOT NULL,
    "petId" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "branchServiceId" UUID NOT NULL,
    "veterinarianId" UUID NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "priceAtBooking" DECIMAL(12,2) NOT NULL,
    "confirmationExpiresAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("idAppointment")
);

-- CreateTable
CREATE TABLE "AppointmentHistory" (
    "idAppointmentHistory" UUID NOT NULL,
    "appointmentId" UUID NOT NULL,
    "performedByUserId" UUID,
    "action" "AppointmentHistoryAction" NOT NULL,
    "previousData" JSONB,
    "newData" JSONB,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppointmentHistory_pkey" PRIMARY KEY ("idAppointmentHistory")
);

-- CreateTable
CREATE TABLE "StaffSchedule" (
    "idStaffSchedule" UUID NOT NULL,
    "staffId" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "weekDay" "WeekDay" NOT NULL,
    "startsAt" TEXT NOT NULL,
    "endsAt" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffSchedule_pkey" PRIMARY KEY ("idStaffSchedule")
);

-- CreateTable
CREATE TABLE "AppointmentBlock" (
    "idAppointmentBlock" UUID NOT NULL,
    "staffId" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "reason" "AppointmentBlockReason" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppointmentBlock_pkey" PRIMARY KEY ("idAppointmentBlock")
);

-- CreateIndex
CREATE INDEX "Appointment_customerId_startsAt_idx" ON "Appointment"("customerId", "startsAt");

-- CreateIndex
CREATE INDEX "Appointment_petId_startsAt_idx" ON "Appointment"("petId", "startsAt");

-- CreateIndex
CREATE INDEX "Appointment_veterinarianId_startsAt_idx" ON "Appointment"("veterinarianId", "startsAt");

-- CreateIndex
CREATE INDEX "Appointment_branchId_startsAt_idx" ON "Appointment"("branchId", "startsAt");

-- CreateIndex
CREATE INDEX "Appointment_status_confirmationExpiresAt_idx" ON "Appointment"("status", "confirmationExpiresAt");

-- CreateIndex
CREATE INDEX "AppointmentHistory_appointmentId_createdAt_idx" ON "AppointmentHistory"("appointmentId", "createdAt");

-- CreateIndex
CREATE INDEX "AppointmentHistory_performedByUserId_createdAt_idx" ON "AppointmentHistory"("performedByUserId", "createdAt");

-- CreateIndex
CREATE INDEX "StaffSchedule_staffId_branchId_weekDay_isActive_idx" ON "StaffSchedule"("staffId", "branchId", "weekDay", "isActive");

-- CreateIndex
CREATE INDEX "StaffSchedule_branchId_weekDay_isActive_idx" ON "StaffSchedule"("branchId", "weekDay", "isActive");

-- CreateIndex
CREATE INDEX "AppointmentBlock_staffId_startsAt_endsAt_idx" ON "AppointmentBlock"("staffId", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "AppointmentBlock_branchId_startsAt_endsAt_idx" ON "AppointmentBlock"("branchId", "startsAt", "endsAt");

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("idUser") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("idUser") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("idPet") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("idBranch") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_branchServiceId_fkey" FOREIGN KEY ("branchServiceId") REFERENCES "BranchService"("idBranchService") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_veterinarianId_fkey" FOREIGN KEY ("veterinarianId") REFERENCES "Staff"("idStaff") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentHistory" ADD CONSTRAINT "AppointmentHistory_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("idAppointment") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentHistory" ADD CONSTRAINT "AppointmentHistory_performedByUserId_fkey" FOREIGN KEY ("performedByUserId") REFERENCES "User"("idUser") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffSchedule" ADD CONSTRAINT "StaffSchedule_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("idStaff") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffSchedule" ADD CONSTRAINT "StaffSchedule_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("idBranch") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentBlock" ADD CONSTRAINT "AppointmentBlock_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("idStaff") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentBlock" ADD CONSTRAINT "AppointmentBlock_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("idBranch") ON DELETE RESTRICT ON UPDATE CASCADE;
