import { vi } from 'vitest';
import { PetsService } from '../pets.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

export function createPetsServiceTestContext() {
    const prismaMock = {
        client: {
            user: {
                findUnique: vi.fn(),
            },
            pet: {
                create: vi.fn(),
                findMany: vi.fn(),
                findFirst: vi.fn(),
                findUnique: vi.fn(),
                update: vi.fn(),
            },
        },
    };

    const service = new PetsService(
        prismaMock as unknown as PrismaService,
    );

    return {
        service,
        prismaMock,
    };
}