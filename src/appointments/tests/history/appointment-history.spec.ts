import {
    NotFoundException,
} from '@nestjs/common';
import {
    beforeEach,
    describe,
    expect,
    it,
} from 'vitest';

import { AppointmentHistoryService } from '../../services/appointment-history.service.js';
import {
    HISTORY_TEST_FIXTURES,
    HISTORY_TEST_IDS,
    createHistoryTestContext,
} from './history-test.utils.js';

describe('AppointmentHistoryService', () => {
    let context: ReturnType<typeof createHistoryTestContext>;
    let service: AppointmentHistoryService;

    beforeEach(() => {
        context = createHistoryTestContext();
        service = new AppointmentHistoryService(context.prismaServiceMock);

        context.prismaMock.client.appointment.findUnique.mockResolvedValue(
            HISTORY_TEST_FIXTURES.appointment,
        );

        context.prismaMock.client.appointmentHistory.findMany.mockResolvedValue(
            HISTORY_TEST_FIXTURES.history,
        );
    });

    it('should return appointment history for its customer', async () => {
        const result = await service.getAppointmentHistory(
            HISTORY_TEST_IDS.appointment,
            HISTORY_TEST_IDS.customer,
            false,
        );

        expect(result).toEqual(HISTORY_TEST_FIXTURES.history);

        expect(
            context.prismaMock.client.appointmentHistory.findMany,
        ).toHaveBeenCalledWith({
            where: {
                appointmentId: HISTORY_TEST_IDS.appointment,
            },
            include: {
                performedBy: {
                    select: {
                        idUser: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
        });
    });

    it('should allow staff to access any appointment history', async () => {
        const result = await service.getAppointmentHistory(
            HISTORY_TEST_IDS.appointment,
            HISTORY_TEST_IDS.staff,
            true,
        );

        expect(result).toEqual(HISTORY_TEST_FIXTURES.history);

        expect(
            context.prismaMock.client.appointmentHistory.findMany,
        ).toHaveBeenCalledOnce();
    });

    it('should throw when the appointment does not exist', async () => {
        context.prismaMock.client.appointment.findUnique.mockResolvedValue(
            null,
        );

        await expect(
            service.getAppointmentHistory(
                HISTORY_TEST_IDS.appointment,
                HISTORY_TEST_IDS.customer,
                false,
            ),
        ).rejects.toThrow(
            new NotFoundException('Appointment not found'),
        );

        expect(
            context.prismaMock.client.appointmentHistory.findMany,
        ).not.toHaveBeenCalled();
    });

    it('should throw when the customer does not own the appointment', async () => {
        await expect(
            service.getAppointmentHistory(
                HISTORY_TEST_IDS.appointment,
                HISTORY_TEST_IDS.anotherCustomer,
                false,
            ),
        ).rejects.toThrow(
            new NotFoundException('Appointment not found'),
        );

        expect(
            context.prismaMock.client.appointmentHistory.findMany,
        ).not.toHaveBeenCalled();
    });

    it('should return an empty history when no records exist', async () => {
        context.prismaMock.client.appointmentHistory.findMany.mockResolvedValue(
            [],
        );

        const result = await service.getAppointmentHistory(
            HISTORY_TEST_IDS.appointment,
            HISTORY_TEST_IDS.customer,
            false,
        );

        expect(result).toEqual([]);
    });
});