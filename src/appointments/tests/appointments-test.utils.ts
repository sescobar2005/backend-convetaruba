
import { vi } from 'vitest';

import {
    AppointmentStatus,
    StaffPosition,
} from '../../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';

export const APPOINTMENT_TEST_IDS = {
    branch: 'e5f6a7b8-c9d0-4123-8567-89abcdef0321',
    veterinarian: 'a7b8c9d0-e1f2-4234-9678-9abcdef01234',
    customer: 'b8c9d0e1-f2a3-4345-8789-abcdef012345',
    pet: 'c9d0e1f2-a3b4-4456-8890-abcdef012345',
    branchService: 'd0e1f2a3-b4c5-4567-9901-abcdef012345',
    appointment: 'e1f2a3b4-c5d6-4678-9012-abcdef012345',
    appointmentBlock: 'f2a3b4c5-d6e7-4789-8123-abcdef012345',
};

export const APPOINTMENT_TEST_DATE = '2030-05-06';

export const APPOINTMENT_TEST_FIXTURES = {
    branch: {
        idBranch: APPOINTMENT_TEST_IDS.branch,
        isActive: true,
        timeZone: 'America/Aruba',
    },

    veterinarian: {
        idStaff: APPOINTMENT_TEST_IDS.veterinarian,
        position: StaffPosition.VETERINARIAN,
        isActive: true,
    },

    assignment: {
        idStaffBranch: 'a3b4c5d6-e7f8-4890-9234-abcdef012345',
    },

    schedule: {
        startsAt: '08:00',
        endsAt: '12:00',
    },

    appointment: {
        idAppointment: APPOINTMENT_TEST_IDS.appointment,
        startsAt: new Date('2030-05-06T12:00:00.000Z'),
        endsAt: new Date('2030-05-06T12:20:00.000Z'),
        status: AppointmentStatus.CONFIRMED,
    },

    block: {
        idAppointmentBlock: APPOINTMENT_TEST_IDS.appointmentBlock,
        startsAt: new Date('2030-05-06T13:00:00.000Z'),
        endsAt: new Date('2030-05-06T13:20:00.000Z'),
    },
};

export function createAppointmentsTestContext() {
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
            findUnique: vi.fn(),
            findMany: vi.fn(),
            updateMany: vi.fn(),
        },

        appointmentBlock: {
            findMany: vi.fn(),
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

            branch: {
                findUnique: vi.fn(),
            },

            appointment: {
                findUnique: vi.fn(),
                findMany: vi.fn(),
            },

            appointmentHistory: {
                findMany: vi.fn(),
            },
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

export type AppointmentsTestContext = ReturnType<
    typeof createAppointmentsTestContext
>;
