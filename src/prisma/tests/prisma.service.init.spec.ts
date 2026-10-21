
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

describe('PrismaService - initialization', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        prismaClientMock.$connect.mockResolvedValue(undefined);
        prismaClientMock.$disconnect.mockResolvedValue(undefined);
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('should create the PostgreSQL adapter using DATABASE_URL', () => {
        const databaseUrl = 'postgresql://test:test@localhost:5432/test_db';
        vi.stubEnv('DATABASE_URL', databaseUrl);

        const service = new PrismaService();

        expect(PrismaPgMock).toHaveBeenCalledWith({
            connectionString: databaseUrl,
        });

        expect(PrismaClientMock).toHaveBeenCalledWith({
            adapter: { adapter: 'mock-postgres-adapter' },
        });

        expect(service.client).toBe(prismaClientMock);
    });

    it('should connect to the database when the module initializes', async () => {
        const service = new PrismaService();

        await service.onModuleInit();

        expect(prismaClientMock.$connect).toHaveBeenCalledOnce();
    });

    it('should propagate connection errors during initialization', async () => {
        const service = new PrismaService();
        const error = new Error('Database connection failed');

        prismaClientMock.$connect.mockRejectedValueOnce(error);

        await expect(service.onModuleInit()).rejects.toThrow(
            'Database connection failed',
        );
    });
});