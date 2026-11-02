-- CreateTable
CREATE TABLE "BranchService" (
    "idBranchService" UUID NOT NULL,
    "branchId" UUID NOT NULL,
    "serviceId" UUID NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BranchService_pkey" PRIMARY KEY ("idBranchService")
);

-- CreateTable
CREATE TABLE "BranchServicePrice" (
    "idBranchServicePrice" UUID NOT NULL,
    "branchServiceId" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BranchServicePrice_pkey" PRIMARY KEY ("idBranchServicePrice")
);

-- CreateIndex
CREATE INDEX "BranchService_branchId_isActive_idx" ON "BranchService"("branchId", "isActive");

-- CreateIndex
CREATE INDEX "BranchService_serviceId_isActive_idx" ON "BranchService"("serviceId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "BranchService_branchId_serviceId_key" ON "BranchService"("branchId", "serviceId");

-- CreateIndex
CREATE INDEX "BranchServicePrice_branchServiceId_validFrom_idx" ON "BranchServicePrice"("branchServiceId", "validFrom");

-- AddForeignKey
ALTER TABLE "BranchService" ADD CONSTRAINT "BranchService_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("idBranch") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchService" ADD CONSTRAINT "BranchService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("idService") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchServicePrice" ADD CONSTRAINT "BranchServicePrice_branchServiceId_fkey" FOREIGN KEY ("branchServiceId") REFERENCES "BranchService"("idBranchService") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "BranchServicePrice_one_active_price"
ON "BranchServicePrice" ("branchServiceId")
WHERE "validUntil" IS NULL;