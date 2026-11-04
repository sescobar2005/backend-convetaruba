import { vi } from 'vitest';

import { NotificationsService } from '../notifications.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

export function createNotificationsServiceTestContext() {
    const prismaMock = {
        client: {
            notification: {
                create: vi.fn(),
                findMany: vi.fn(),
                count: vi.fn(),
                findFirst: vi.fn(),
                update: vi.fn(),
                updateMany: vi.fn(),
            },
        },
    };

    const service = new NotificationsService(
        prismaMock as unknown as PrismaService,
    );

    return {
        service,
        prismaMock,
    };
}