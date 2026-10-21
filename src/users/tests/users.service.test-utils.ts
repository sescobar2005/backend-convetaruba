import { vi } from 'vitest';
import { UsersService } from '../users.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

export function createUsersServiceTestContext() {
    const prismaMock = {
        client: {
            user: {
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn()
            },
        },
    };

    const service = new UsersService(
        prismaMock as unknown as PrismaService
    );

    return {
        service,
        prismaMock
    };
}