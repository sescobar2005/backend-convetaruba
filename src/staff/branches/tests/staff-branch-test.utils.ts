import { vi } from 'vitest';

import { StaffBranchService } from '../staff-branch.service.js';
import { PrismaService } from '../../../prisma/prisma.service.js';

export function createStaffBranchServiceTestContext() {
  const prismaMock = {
    client: {
      staff: {
        findUnique: vi.fn(),
      },
      branch: {
        findUnique: vi.fn(),
      },
      staffBranch: {
        create: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
      },
    },
  };

  const service = new StaffBranchService(
    prismaMock as unknown as PrismaService,
  );

  return {
    service,
    prismaMock,
  };
}

export type StaffBranchServiceTestContext = ReturnType<
  typeof createStaffBranchServiceTestContext
>;