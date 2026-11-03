import { vi } from 'vitest';

import {
    AppointmentStatus,
    StaffPosition,
} from '../../../../generated/prisma/enums.js';
import { PrismaService } from '../../../prisma/prisma.service.js';

export const AVAILABILITY_TEST_IDS = {
    branch: 'e5f6a7b8-c9d0-4123-8567-89abcdef0321',
    veterinarian: 'a7b8c9d0-e1f2-4234-9678-9abcdef01234',
};

export const AVAILABILITY_TEST_DATE = '2030-05-06';

export const AVAILABILITY_TEST_FIXTURES = {
    branch: {
        idBranch: AVAILABILITY_TEST_IDS.branch,
        isActive: true,
        timeZone: 'America/Aruba',
    },

    veterinarian: {
        idStaff: AVAILABILITY_TEST_IDS.veterinarian,
        position: StaffPosition.VETERINARIAN,
        isActive: true,
    },

    assignment: {
        idStaffBranch: 'a3b4c5d6-e7f8-4890-9234-abcdef012345',
    },

    schedules: [
        {
            startsAt: '08:00',
            endsAt: '12:00',
        },
    ],

    appointments: [
        {
            startsAt: new Date('2030-05-06T12:40:00.000Z'),
            endsAt: new Date('2030-05-06T13:00:00.000Z'),
        },
    ],

    blocks: [
        {
            startsAt: new Date('2030-05-06T13:20:00.000Z'),
            endsAt: new Date('2030-05-06T13:40:00.000Z'),
        },
    ],
};

export function createAvailabilityTestContext() {
    const transactionMock = {
        branch: {
            findUnique: vi.fn(),
        },

        staff: {
            findUnique: vi.fn(),
        },

        staffBranch: {
            findFirst: vi.fn(),
        },

        staffSchedule: {
            findMany: vi.fn(),
        },

        appointment: {
            findMany: vi.fn(),
        },

        appointmentBlock: {
            findMany: vi.fn(),
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

    const expirationServiceMock = {
        expirePendingAppointments: vi.fn().mockResolvedValue(undefined),
    };

    return {
        prismaMock: prismaMock as unknown as PrismaService,
        transactionMock,
        expirationServiceMock,
    };
}

export type AvailabilityTestContext = ReturnType<
    typeof createAvailabilityTestContext
>;