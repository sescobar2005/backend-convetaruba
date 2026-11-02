import { vi } from 'vitest';

import { PrismaService } from '../../../prisma/prisma.service.js';
import { BranchServicesService } from '../branch-services.service.js';

export function createBranchServicesServiceTestContext() {
    const transactionMock = {
        branchServicePrice: {
            findFirst: vi.fn(),
            update: vi.fn(),
            create: vi.fn(),
        },
    };

    const prismaMock = {
        client: {
            branch: {
                findUnique: vi.fn(),
            },
            service: {
                findUnique: vi.fn(),
            },
            branchService: {
                findUnique: vi.fn(),
                findMany: vi.fn(),
                create: vi.fn(),
                update: vi.fn(),
            },
            branchServicePrice: {
                findMany: vi.fn(),
            },
            $transaction: vi.fn(
                async (
                    callback: (
                        transaction: typeof transactionMock,
                    ) => Promise<unknown>,
                ) => callback(transactionMock),
            ),
        },
    };

    const service = new BranchServicesService(
        prismaMock as unknown as PrismaService,
    );

    return {
        service,
        prismaMock,
        transactionMock,
    };
}

export type BranchServicesServiceTestContext = ReturnType<
    typeof createBranchServicesServiceTestContext
>;