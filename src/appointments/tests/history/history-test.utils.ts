import { vi } from 'vitest';

import { PrismaService } from '../../../prisma/prisma.service.js';

export const HISTORY_TEST_IDS = {
    appointment: 'e1f2a3b4-c5d6-4678-9012-abcdef012345',
    customer: 'b8c9d0e1-f2a3-4345-8789-abcdef012345',
    anotherCustomer: 'c9d0e1f2-a3b4-4456-8890-abcdef012346',
    staff: 'a7b8c9d0-e1f2-4234-9678-9abcdef01234',
};

export const HISTORY_TEST_FIXTURES = {
    appointment: {
        idAppointment: HISTORY_TEST_IDS.appointment,
        customerId: HISTORY_TEST_IDS.customer,
    },

    history: [
        {
            idAppointmentHistory: 'f2a3b4c5-d6e7-4789-8123-abcdef012345',
            appointmentId: HISTORY_TEST_IDS.appointment,
            action: 'CREATED',
            reason: 'Appointment request created',
            createdAt: new Date('2030-05-06T12:00:00.000Z'),
            performedBy: {
                idUser: HISTORY_TEST_IDS.customer,
                firstName: 'Test',
                lastName: 'Customer',
                role: 'CUSTOMER',
            },
        },
    ],
};


export function createHistoryTestContext() {
    const prismaMock = {
        client: {
            appointment: {
                findUnique: vi.fn(),
            },

            appointmentHistory: {
                findMany: vi.fn(),
            },
        },
    };

    return {
        prismaMock,
        prismaServiceMock: prismaMock as unknown as PrismaService,
    };
}


export type HistoryTestContext = ReturnType<
    typeof createHistoryTestContext
>;