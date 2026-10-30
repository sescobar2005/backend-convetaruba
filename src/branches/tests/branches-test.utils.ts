import { beforeEach, vi } from 'vitest';

import { PrismaService } from '../../prisma/prisma.service.js';
import { BranchesService } from '../branches.service.js';

export const createBranchesServiceMock = () => {
    const prismaServiceMock = {
        client: {
            branch: {
                create: vi.fn(),
                findMany: vi.fn(),
                findUnique: vi.fn(),
                update: vi.fn(),
            },
        },
    };

    const branchesService = new BranchesService(
        prismaServiceMock as unknown as PrismaService,
    );

    return {
        branchesService,
        prismaServiceMock,
    };
};