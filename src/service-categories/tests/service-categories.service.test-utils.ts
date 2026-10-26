
import { vi } from 'vitest';
import { ServiceCategoriesService } from '../service-categories.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

export function createServiceCategoriesServiceTestContext() {
    const prismaMock = {
        client: {
            serviceCategory: {
                findMany: vi.fn(),
                findUnique: vi.fn(),
                create: vi.fn(),
                update: vi.fn(),
            },
            service: {
                count: vi.fn(),
            },
        },
    };

    const service = new ServiceCategoriesService(
        prismaMock as unknown as PrismaService,
    );

    return {
        service,
        prismaMock,
    };
}