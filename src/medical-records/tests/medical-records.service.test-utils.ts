import { vi } from 'vitest';

import { MedicalRecordsService } from '../medical-records.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

export function createMedicalRecordsServiceTestContext() {
    const prismaMock = {
        client: {
            staff: {
                findUnique: vi.fn(),
            },
            pet: {
                findUnique: vi.fn(),
            },
            medicalRecord: {
                findUnique: vi.fn(),
                findMany: vi.fn(),
                count: vi.fn(),
                update: vi.fn(),
            },
            $transaction: vi.fn(
                async (operations: Promise<unknown>[]) =>
                    Promise.all(operations),
            ),
        },
    };

    const service = new MedicalRecordsService(
        prismaMock as unknown as PrismaService,
    );

    return {
        service,
        prismaMock,
    };
}