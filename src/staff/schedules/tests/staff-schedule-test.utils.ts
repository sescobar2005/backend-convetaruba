import { vi } from 'vitest';

import { PrismaService } from '../../../prisma/prisma.service.js';
import { StaffScheduleService } from '../staff-schedule.service.js';

export function createStaffScheduleServiceTestContext() {
    const prismaMock = {
        client: {
            staff: {
                findUnique: vi.fn(),
            },
            branch: {
                findUnique: vi.fn(),
            },
            staffBranch: {
                findFirst: vi.fn(),
            },
            staffSchedule: {
                findFirst: vi.fn(),
                findMany: vi.fn(),
                create: vi.fn(),
                update: vi.fn(),
            },
        },
    };

    const service = new StaffScheduleService(
        prismaMock as unknown as PrismaService,
    );

    return {
        service,
        prismaMock,
    };
}

export type StaffScheduleServiceTestContext =
    ReturnType<typeof createStaffScheduleServiceTestContext>;