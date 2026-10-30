-- CreateTable
CREATE TABLE "Branch" (
    "idBranch" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("idBranch")
);

-- CreateTable
CREATE TABLE "StaffBranch" (
    "idStaffBranch" UUID NOT NULL,
    "staffId" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffBranch_pkey" PRIMARY KEY ("idStaffBranch")
);

-- CreateIndex
CREATE UNIQUE INDEX "Branch_slug_key" ON "Branch"("slug");

-- CreateIndex
CREATE INDEX "StaffBranch_staffId_isActive_idx" ON "StaffBranch"("staffId", "isActive");

-- CreateIndex
CREATE INDEX "StaffBranch_branchId_isActive_idx" ON "StaffBranch"("branchId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "StaffBranch_staffId_branchId_startDate_key" ON "StaffBranch"("staffId", "branchId", "startDate");

-- AddForeignKey
ALTER TABLE "StaffBranch" ADD CONSTRAINT "StaffBranch_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("idStaff") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffBranch" ADD CONSTRAINT "StaffBranch_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("idBranch") ON DELETE RESTRICT ON UPDATE CASCADE;
