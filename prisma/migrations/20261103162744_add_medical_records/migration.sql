-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "completedAt" TIMESTAMPTZ(3);

-- CreateTable
CREATE TABLE "MedicalRecord" (
    "idMedicalRecord" UUID NOT NULL,
    "appointmentId" UUID NOT NULL,
    "petId" UUID NOT NULL,
    "veterinarianId" UUID NOT NULL,
    "observations" TEXT,
    "diagnosis" TEXT,
    "treatment" TEXT,
    "recommendations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalRecord_pkey" PRIMARY KEY ("idMedicalRecord")
);

-- CreateIndex
CREATE UNIQUE INDEX "MedicalRecord_appointmentId_key" ON "MedicalRecord"("appointmentId");

-- CreateIndex
CREATE INDEX "MedicalRecord_petId_createdAt_idx" ON "MedicalRecord"("petId", "createdAt");

-- CreateIndex
CREATE INDEX "MedicalRecord_veterinarianId_createdAt_idx" ON "MedicalRecord"("veterinarianId", "createdAt");

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("idAppointment") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("idPet") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_veterinarianId_fkey" FOREIGN KEY ("veterinarianId") REFERENCES "Staff"("idStaff") ON DELETE RESTRICT ON UPDATE CASCADE;
