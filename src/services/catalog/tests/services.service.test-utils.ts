import { vi } from 'vitest';
import { PrismaService } from "../../../prisma/prisma.service.js";
import { ServicesService } from "../services.service.js";


export function createServicesServiceTestContext() {
    const prismaMock = {
        client: {
            service: {
                findMany: vi.fn(),
                findUnique: vi.fn(),
                create: vi.fn(),
                update: vi.fn(),
                count: vi.fn()
            },
            serviceCategory: {
                findUnique: vi.fn()
            }
        }
    };

    const service = new ServicesService(prismaMock as unknown as PrismaService);

    return { service, prismaMock };

}