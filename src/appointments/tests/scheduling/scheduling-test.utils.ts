import { vi } from 'vitest';

import {
    AppointmentStatus,
    StaffPosition,
    WeekDay,
} from '../../../../generated/prisma/enums.js';
import { PrismaService } from '../../../prisma/prisma.service.js';

export const SCHEDULING_TEST_IDS = {
    customer: 'a1b2c3d4-e5f6-4789-8123-456789abcdef',
    pet: 'b2c3d4e5-f6a7-4890-9234-56789abcdef1',
    branch: 'c3d4e5f6-a7b8-4901-a345-6789abcdef12',
    branchService: 'd4e5f6a7-b8c9-4012-b456-789abcdef123',
    veterinarian: 'e5f6a7b8-c9d0-4123-8567-89abcdef0123',
    appointment: 'f6a7b8c9-d0e1-4234-9678-9abcdef01234',
    staffBranch: 'a7b8c9d0-e1f2-4345-8789-abcdef012345',
};

export const SCHEDULING_TEST_DATES = {
    now: new Date('2035-05-14T12:00:00.000Z'),
    startsAt: new Date('2035-05-14T14:00:00.000Z'),
    endsAt: new Date('2035-05-14T14:20:00.000Z'),
    confirmationExpiresAt: new Date('2035-05-14T12:15:00.000Z'),
};

export const SCHEDULING_TEST_FIXTURES = {
    customer: {
        idUser: SCHEDULING_TEST_IDS.customer,
        role: 'CUSTOMER',
    },

    pet: {
        idPet: SCHEDULING_TEST_IDS.pet,
    },

    branch: {
        idBranch: SCHEDULING_TEST_IDS.branch,
        isActive: true,
        timeZone: 'America/Aruba',
    },

    veterinarian: {
        idStaff: SCHEDULING_TEST_IDS.veterinarian,
        position: StaffPosition.VETERINARIAN,
        isActive: true,
    },

    branchService: {
        idBranchService: SCHEDULING_TEST_IDS.branchService,
        branchId: SCHEDULING_TEST_IDS.branch,
        isActive: true,
        service: {
            isActive: true,
            isPublished: true,
        },
    },

    currentPrice: {
        amount: 75000,
    },

    assignment: {
        idStaffBranch: SCHEDULING_TEST_IDS.staffBranch,
    },

    schedule: {
        startsAt: '08:00',
        endsAt: '12:00',
    },

    appointment: {
        idAppointment: SCHEDULING_TEST_IDS.appointment,
        customerId: SCHEDULING_TEST_IDS.customer,
        createdByUserId: SCHEDULING_TEST_IDS.customer,
        petId: SCHEDULING_TEST_IDS.pet,
        branchId: SCHEDULING_TEST_IDS.branch,
        branchServiceId: SCHEDULING_TEST_IDS.branchService,
        veterinarianId: SCHEDULING_TEST_IDS.veterinarian,
        startsAt: SCHEDULING_TEST_DATES.startsAt,
        endsAt: SCHEDULING_TEST_DATES.endsAt,
        status: AppointmentStatus.PENDING,
        priceAtBooking: 75000,
        confirmationExpiresAt:
            SCHEDULING_TEST_DATES.confirmationExpiresAt,
        notes: null,
    },
};

export function createSchedulingTestContext() {
    const transactionMock = {
        user: {
            findUnique: vi.fn(),
        },

        pet: {
            findFirst: vi.fn(),
        },

        branch: {
            findUnique: vi.fn(),
        },

        staff: {
            findUnique: vi.fn(),
        },

        branchService: {
            findUnique: vi.fn(),
            findFirst: vi.fn(),
        },

        branchServicePrice: {
            findFirst: vi.fn(),
        },

        staffBranch: {
            findFirst: vi.fn(),
        },

        staffSchedule: {
            findMany: vi.fn(),
        },

        appointment: {
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            updateMany: vi.fn(),
        },

        appointmentBlock: {
            findFirst: vi.fn(),
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

export type SchedulingTestContext = ReturnType<
    typeof createSchedulingTestContext
>;