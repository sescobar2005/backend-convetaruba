import { vi } from 'vitest';

import {
    AppointmentStatus,
} from '../../../../generated/prisma/enums.js';
import { PrismaService } from '../../../prisma/prisma.service.js';

export const EXPIRATION_TEST_IDS = {
    veterinarian: 'a7b8c9d0-e1f2-4234-9678-9abcdef01234',
    appointment: 'e1f2a3b4-c5d6-4678-9012-abcdef012345',
};

export const EXPIRATION_TEST_FIXTURES = {
    pendingAppointment: {
        idAppointment: EXPIRATION_TEST_IDS.appointment,
        status: AppointmentStatus.PENDING,
        confirmationExpiresAt: new Date('2030-05-06T12:15:00.000Z'),
    },
};

export function createExpirationTestContext() {
    const transactionMock = {
        appointment: {
            findMany: vi.fn(),
            updateMany: vi.fn(),
        },

        appointmentHistory: {
            create: vi.fn(),
        },
    };

    const prismaMock = {
        client: {
            $transaction: vi.fn(
                async (
                    callback: (
                        transaction: typeof transactionMock,
                    ) => Promise<unknown>,
                ) => callback(transactionMock),
            ),
        },
    };

    return {
        prismaMock: prismaMock as unknown as PrismaService,
        transactionMock,
    };
}

export type ExpirationTestContext = ReturnType<
    typeof createExpirationTestContext
>;