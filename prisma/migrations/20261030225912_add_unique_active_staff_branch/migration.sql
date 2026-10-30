CREATE UNIQUE INDEX "StaffBranch_one_active_assignment_per_staff_branch"
ON "StaffBranch" ("staffId", "branchId")
WHERE "isActive" = true;