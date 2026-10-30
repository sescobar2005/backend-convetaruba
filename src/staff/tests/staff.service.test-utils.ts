import { vi } from 'vitest';

import { StaffService } from '../staff.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

export function createStaffServiceTestContext() {
    const prismaMock = {
        client: {
            staff: {
                create: vi.fn(),
                findMany: vi.fn(),
                findUnique: vi.fn(),
                update: vi.fn(),
            },
            user: {
                findUnique: vi.fn(),
            },
        },
    };

    const service = new StaffService(
        prismaMock as unknown as PrismaService,
    );

    return {
        service,
        prismaMock,
    };
}

export type StaffServiceTestContext = ReturnType<
    typeof createStaffServiceTestContext
>;