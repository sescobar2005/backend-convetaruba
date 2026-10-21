
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prismaClientMock, PrismaClientMock, PrismaPgMock } = vi.hoisted(() => {
    const clientMock = {
        $connect: vi.fn(),
        $disconnect: vi.fn(),
    };

    return {
        prismaClientMock: clientMock,
        PrismaClientMock: vi.fn(function () {
            return clientMock;
        }),
        PrismaPgMock: vi.fn(function () {
            return { adapter: 'mock-postgres-adapter' };
        }),
    };
});

vi.mock('@prisma/adapter-pg', () => ({
    PrismaPg: PrismaPgMock,
}));

// This path is relative to the test file.
vi.mock('../../../generated/prisma/client.js', () => ({
    PrismaClient: PrismaClientMock,
}));

import { PrismaService } from '../prisma.service.js';

describe('PrismaService - destruction', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        prismaClientMock.$connect.mockResolvedValue(undefined);
        prismaClientMock.$disconnect.mockResolvedValue(undefined);
    });

    it('should disconnect from the database when the module is destroyed', async () => {
        const service = new PrismaService();

        await service.onModuleDestroy();

        expect(prismaClientMock.$disconnect).toHaveBeenCalledOnce();
    });

    it('should propagate disconnection errors during destruction', async () => {
        const service = new PrismaService();
        const error = new Error('Database disconnection failed');

        prismaClientMock.$disconnect.mockRejectedValueOnce(error);

        await expect(service.onModuleDestroy()).rejects.toThrow(
            'Database disconnection failed',
        );
    });
});