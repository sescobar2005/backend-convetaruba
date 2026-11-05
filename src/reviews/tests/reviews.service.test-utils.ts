
import { vi } from 'vitest';

import { ReviewsService } from '../reviews.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

export function createReviewsServiceTestContext() {
    const prismaMock = {
        client: {
            appointment: {
                findUnique: vi.fn(),
            },
            review: {
                create: vi.fn(),
                findUnique: vi.fn(),
                findMany: vi.fn(),
                count: vi.fn(),
                update: vi.fn(),
            },
            $transaction: vi.fn(),
        },
    };

    const service = new ReviewsService(
        prismaMock as unknown as PrismaService,
    );

    return {
        service,
        prismaMock,
    };
}