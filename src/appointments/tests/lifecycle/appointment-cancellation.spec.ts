import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
    AppointmentHistoryAction,
    AppointmentStatus,
} from '../../../../generated/prisma/enums.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    createLifecycleTestContext,
    LIFECYCLE_TEST_IDS,
    LIFECYCLE_TEST_REASONS,
} from './lifecycle-test.utils.js';
import { AppointmentCancellationService } from '../../services/lifecycle/appointment-cancellation.service.js';

describe('AppointmentCancellationService', () => {
    let context: ReturnType<typeof createLifecycleTestContext>;
    let service: AppointmentCancellationService;

    beforeEach(() => {
        context = createLifecycleTestContext();
        service = new AppointmentCancellationService(
            context.prismaServiceMock,
        );
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should cancel a valid pending appointment', async () => {
        context.transactionMock.appointment.findUnique
            .mockResolvedValueOnce(context.appointment)
            .mockResolvedValueOnce(context.cancelledAppointment);

        const result = await service.cancelAppointment(
            LIFECYCLE_TEST_IDS.appointment,
            LIFECYCLE_TEST_IDS.staff,
            context.dtos.cancellation,
        );

        expect(
            context.transactionMock.appointment.updateMany,
        ).toHaveBeenCalledTimes(1);

        expect(
            context.transactionMock.appointment.updateMany,
        ).toHaveBeenCalledWith({
            where: expect.objectContaining({
                idAppointment: LIFECYCLE_TEST_IDS.appointment,
                status: {
                    in: [
                        AppointmentStatus.PENDING,
                        AppointmentStatus.CONFIRMED,
                    ],
                },
            }),
            data: expect.objectContaining({
                status: AppointmentStatus.CANCELLED,
                cancelledAt: expect.any(Date),
                cancellationReason:
                    LIFECYCLE_TEST_REASONS.cancellation,
            }),
        });

        expect(
            context.transactionMock.appointmentHistory.create,
        ).toHaveBeenCalledWith({
            data: expect.objectContaining({
                appointmentId: LIFECYCLE_TEST_IDS.appointment,
                action: AppointmentHistoryAction.CANCELLED,
                performedByUserId: LIFECYCLE_TEST_IDS.staff,
                reason: LIFECYCLE_TEST_REASONS.cancellation,
            }),
        });

        expect(result).toEqual(context.cancelledAppointment);
    });

    it('should cancel a valid confirmed appointment', async () => {
        context.transactionMock.appointment.findUnique
            .mockResolvedValueOnce(context.confirmedAppointment)
            .mockResolvedValueOnce(context.cancelledAppointment);

        const result = await service.cancelAppointment(
            LIFECYCLE_TEST_IDS.appointment,
            LIFECYCLE_TEST_IDS.staff,
            context.dtos.cancellation,
        );

        expect(
            context.transactionMock.appointment.updateMany,
        ).toHaveBeenCalledTimes(1);

        expect(result).toEqual(context.cancelledAppointment);
    });

    it('should throw NotFoundException when the appointment does not exist', async () => {
        context.transactionMock.appointment.findUnique.mockResolvedValue(null);

        await expect(
            service.cancelAppointment(
                LIFECYCLE_TEST_IDS.appointment,
                LIFECYCLE_TEST_IDS.staff,
                context.dtos.cancellation,
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

    it('should mark an expired pending appointment as expired instead of cancelled', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(
            new Date('2035-05-14T14:00:00.000Z'),
        );

        context.transactionMock.appointment.findUnique
            .mockResolvedValueOnce(context.appointment)
            .mockResolvedValueOnce(context.expiredAppointment);

        const result = await service.cancelAppointment(
            LIFECYCLE_TEST_IDS.appointment,
            LIFECYCLE_TEST_IDS.staff,
            context.dtos.cancellation,
        );

        expect(
            context.transactionMock.appointment.updateMany,
        ).toHaveBeenCalledWith({
            where: expect.objectContaining({
                idAppointment: LIFECYCLE_TEST_IDS.appointment,
                status: AppointmentStatus.PENDING,
                confirmationExpiresAt: {
                    lte: expect.any(Date),
                },
            }),
            data: {
                status: AppointmentStatus.EXPIRED,
            },
        });

        expect(
            context.transactionMock.appointmentHistory.create,
        ).toHaveBeenCalledWith({
            data: expect.objectContaining({
                appointmentId: LIFECYCLE_TEST_IDS.appointment,
                action: AppointmentHistoryAction.EXPIRED,
                performedByUserId: LIFECYCLE_TEST_IDS.staff,
                reason: LIFECYCLE_TEST_REASONS.expiration,
            }),
        });

        expect(result).toEqual(context.expiredAppointment);
    });

    it('should reject cancellation when the expired appointment status changes during processing', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(
            new Date('2035-05-14T14:00:00.000Z'),
        );

        context.transactionMock.appointment.updateMany.mockResolvedValue({
            count: 0,
        });

        await expect(
            service.cancelAppointment(
                LIFECYCLE_TEST_IDS.appointment,
                LIFECYCLE_TEST_IDS.staff,
                context.dtos.cancellation,
            ),
        ).rejects.toThrow(
            new BadRequestException(
                'Appointment status changed before cancellation could be processed',
            ),
        );

        expect(
            context.transactionMock.appointmentHistory.create,
        ).not.toHaveBeenCalled();
    });

    it('should reject appointments that are neither pending nor confirmed', async () => {
        context.transactionMock.appointment.findUnique.mockResolvedValue({
            ...context.appointment,
            status: AppointmentStatus.REJECTED,
        });

        await expect(
            service.cancelAppointment(
                LIFECYCLE_TEST_IDS.appointment,
                LIFECYCLE_TEST_IDS.staff,
                context.dtos.cancellation,
            ),
        ).rejects.toThrow(
            new BadRequestException(
                'Only pending or confirmed appointments can be cancelled',
            ),
        );

        expect(
            context.transactionMock.appointment.updateMany,
        ).not.toHaveBeenCalled();
    });

    it('should reject cancellation when the conditional update does not affect exactly one record', async () => {
        context.transactionMock.appointment.updateMany.mockResolvedValue({
            count: 0,
        });

        await expect(
            service.cancelAppointment(
                LIFECYCLE_TEST_IDS.appointment,
                LIFECYCLE_TEST_IDS.staff,
                context.dtos.cancellation,
            ),
        ).rejects.toThrow(
            new BadRequestException(
                'Appointment is no longer eligible for cancellation',
            ),
        );

        expect(
            context.transactionMock.appointmentHistory.create,
        ).not.toHaveBeenCalled();
    });

    it('should execute the cancellation operation inside a transaction', async () => {
        context.transactionMock.appointment.findUnique
            .mockResolvedValueOnce(context.appointment)
            .mockResolvedValueOnce(context.cancelledAppointment);

        await service.cancelAppointment(
            LIFECYCLE_TEST_IDS.appointment,
            LIFECYCLE_TEST_IDS.staff,
            context.dtos.cancellation,
        );

        expect(
            context.prismaMock.client.$transaction,
        ).toHaveBeenCalledTimes(1);
    });
});