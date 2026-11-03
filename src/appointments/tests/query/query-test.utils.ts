import { vi } from 'vitest';

import { PrismaService } from '../../../prisma/prisma.service.js';

export const QUERY_TEST_IDS = {
    appointment: 'e1f2a3b4-c5d6-4678-9012-abcdef012345',
    customer: 'b8c9d0e1-f2a3-4345-8789-abcdef012345',
    anotherCustomer: 'c9d0e1f2-a3b4-4456-8890-abcdef012346',
    branch: 'e5f6a7b8-c9d0-4123-8567-89abcdef0321',
};

export const QUERY_TEST_DATE = '2030-05-06';

export const QUERY_TEST_FIXTURES = {
    appointment: {
        idAppointment: QUERY_TEST_IDS.appointment,
        customerId: QUERY_TEST_IDS.customer,
        startsAt: new Date('2030-05-06T12:00:00.000Z'),
    },

    branch: {
        idBranch: QUERY_TEST_IDS.branch,
        timeZone: 'America/Aruba',
    },

    appointments: [
        {
            idAppointment: QUERY_TEST_IDS.appointment,
            customerId: QUERY_TEST_IDS.customer,
            branchId: QUERY_TEST_IDS.branch,
            startsAt: new Date('2030-05-06T12:00:00.000Z'),
        },
    ],
};

export function createQueryTestContext() {
    const prismaMock = {
        client: {
            appointment: {
                findUnique: vi.fn(),
                findMany: vi.fn(),
            },

            branch: {
                findUnique: vi.fn(),
            },
        },
    };

    return {
        prismaMock,
        prismaServiceMock: prismaMock as unknown as PrismaService,
    };
}

export type QueryTestContext = ReturnType<
    typeof createQueryTestContext
>;