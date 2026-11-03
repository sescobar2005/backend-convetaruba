import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
    AppointmentHistoryAction,
    AppointmentStatus,
} from '../../../../generated/prisma/enums.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    createLifecycleTestContext,
    LIFECYCLE_TEST_DATES,
    LIFECYCLE_TEST_IDS,
} from './lifecycle-test.utils.js';
import { AppointmentStartService } from '../../services/lifecycle/appointment-start.service.js';

describe('AppointmentStartService', () => {
    let context: ReturnType<typeof createLifecycleTestContext>;
    let service: AppointmentStartService;

    beforeEach(() => {
        context = createLifecycleTestContext();
        service = new AppointmentStartService(
            context.prismaServiceMock,
        );
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should start a confirmed appointment at its scheduled time', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(LIFECYCLE_TEST_DATES.startsAt);

        context.transactionMock.appointment.findUnique
            .mockResolvedValueOnce(context.confirmedAppointment)
            .mockResolvedValueOnce(context.inProgressAppointment);

        const result = await service.startAppointment(
            LIFECYCLE_TEST_IDS.appointment,
            LIFECYCLE_TEST_IDS.staff,
        );

        expect(
            context.transactionMock.appointment.updateMany,
        ).toHaveBeenCalledWith({
            where: {
                idAppointment: LIFECYCLE_TEST_IDS.appointment,
                status: AppointmentStatus.CONFIRMED,
            },
            data: {
                status: AppointmentStatus.IN_PROGRESS,
            },
        });

        expect(
            context.transactionMock.appointmentHistory.create,
        ).toHaveBeenCalledWith({
            data: expect.objectContaining({
                appointmentId: LIFECYCLE_TEST_IDS.appointment,
                action: AppointmentHistoryAction.STARTED,
                performedByUserId: LIFECYCLE_TEST_IDS.staff,
            }),
        });

        expect(result).toEqual(context.inProgressAppointment);
    });

    it('should throw NotFoundException when the appointment does not exist', async () => {
        context.transactionMock.appointment.findUnique.mockResolvedValue(null);

        await expect(
            service.startAppointment(
                LIFECYCLE_TEST_IDS.appointment,
                LIFECYCLE_TEST_IDS.staff,
            ),
        ).rejects.toThrow(
            new NotFoundException('Appointment not found'),
        );

        expect(
            context.transactionMock.appointment.updateMany,
        ).not.toHaveBeenCalled();

        expect(
            context.transactionMock.appointmentHistory.create,
        ).not.toHaveBeenCalled();
    });

    it('should reject appointments that are not confirmed', async () => {
        context.transactionMock.appointment.findUnique.mockResolvedValue(
            context.appointment,
        );

        await expect(
            service.startAppointment(
                LIFECYCLE_TEST_IDS.appointment,
                LIFECYCLE_TEST_IDS.staff,
            ),
        ).rejects.toThrow(
            new BadRequestException(
                'Only confirmed appointments can be started',
            ),
        );

        expect(
            context.transactionMock.appointment.updateMany,
        ).not.toHaveBeenCalled();
    });

    it('should reject appointments that have not reached their scheduled start time', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(
            new Date('2035-05-14T13:59:59.000Z'),
        );

        context.transactionMock.appointment.findUnique.mockResolvedValue(
            context.confirmedAppointment,
        );

        await expect(
            service.startAppointment(
                LIFECYCLE_TEST_IDS.appointment,
                LIFECYCLE_TEST_IDS.staff,
            ),
        ).rejects.toThrow(
            new BadRequestException(
                'Appointment cannot be started before its scheduled time',
            ),
        );

        expect(
            context.transactionMock.appointment.updateMany,
        ).not.toHaveBeenCalled();
    });

    it('should reject when the conditional update does not affect exactly one record', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(LIFECYCLE_TEST_DATES.startsAt);

        context.transactionMock.appointment.findUnique.mockResolvedValue(
            context.confirmedAppointment,
        );

        context.transactionMock.appointment.updateMany.mockResolvedValue({
            count: 0,
        });

        await expect(
            service.startAppointment(
                LIFECYCLE_TEST_IDS.appointment,
                LIFECYCLE_TEST_IDS.staff,
            ),
        ).rejects.toThrow(
            new BadRequestException(
                'Appointment status changed before it could be started',
            ),
        );

        expect(
            context.transactionMock.appointmentHistory.create,
        ).not.toHaveBeenCalled();
    });

    it('should execute the start operation inside a transaction', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(LIFECYCLE_TEST_DATES.startsAt);

        context.transactionMock.appointment.findUnique
            .mockResolvedValueOnce(context.confirmedAppointment)
            .mockResolvedValueOnce(context.inProgressAppointment);

        await service.startAppointment(
            LIFECYCLE_TEST_IDS.appointment,
            LIFECYCLE_TEST_IDS.staff,
        );

        expect(
            context.prismaMock.client.$transaction,
        ).toHaveBeenCalledTimes(1);
    });
});