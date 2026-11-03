import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
    AppointmentHistoryAction,
    AppointmentStatus,
} from '../../../../generated/prisma/enums.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
    createLifecycleTestContext,
    LIFECYCLE_TEST_DATES,
    LIFECYCLE_TEST_IDS,
    LIFECYCLE_TEST_REASONS,
} from './lifecycle-test.utils.js';
import { AppointmentRejectionService } from '../../services/lifecycle/appointment-rejection.service.js';

describe('AppointmentRejectionService', () => {
    let context: ReturnType<typeof createLifecycleTestContext>;
    let service: AppointmentRejectionService;

    beforeEach(() => {
        context = createLifecycleTestContext();
        service = new AppointmentRejectionService(
            context.prismaServiceMock,
        );
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should reject a valid pending appointment', async () => {
        context.transactionMock.appointment.findUnique
            .mockResolvedValueOnce(context.appointment)
            .mockResolvedValueOnce(context.rejectedAppointment);

        const result = await service.rejectAppointment(
            LIFECYCLE_TEST_IDS.appointment,
            LIFECYCLE_TEST_IDS.staff,
            context.dtos.rejection,
        );

        expect(
            context.transactionMock.appointment.updateMany,
        ).toHaveBeenCalledTimes(1);

        expect(
            context.transactionMock.appointmentHistory.create,
        ).toHaveBeenCalledWith({
            data: expect.objectContaining({
                appointmentId: LIFECYCLE_TEST_IDS.appointment,
                action: AppointmentHistoryAction.REJECTED,
                performedByUserId: LIFECYCLE_TEST_IDS.staff,
                reason: LIFECYCLE_TEST_REASONS.rejection,
            }),
        });

        expect(result).toEqual(context.rejectedAppointment);
    });

    it('should throw NotFoundException when the appointment does not exist', async () => {
        context.transactionMock.appointment.findUnique.mockResolvedValue(null);

        await expect(
            service.rejectAppointment(
                LIFECYCLE_TEST_IDS.appointment,
                LIFECYCLE_TEST_IDS.staff,
                context.dtos.rejection,
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

    it('should reject appointments that are not pending', async () => {
        context.transactionMock.appointment.findUnique.mockResolvedValue({
            ...context.appointment,
            status: AppointmentStatus.CONFIRMED,
        });

        await expect(
            service.rejectAppointment(
                LIFECYCLE_TEST_IDS.appointment,
                LIFECYCLE_TEST_IDS.staff,
                context.dtos.rejection,
            ),
        ).rejects.toThrow(
            new BadRequestException(
                'Only pending appointments can be rejected',
            ),
        );

        expect(
            context.transactionMock.appointment.updateMany,
        ).not.toHaveBeenCalled();
    });

    it('should mark expired appointments as expired instead of rejected', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(
            new Date('2035-05-14T14:00:00.000Z'),
        );

        context.transactionMock.appointment.findUnique
            .mockResolvedValueOnce(context.appointment)
            .mockResolvedValueOnce(context.expiredAppointment);

        const result = await service.rejectAppointment(
            LIFECYCLE_TEST_IDS.appointment,
            LIFECYCLE_TEST_IDS.staff,
            context.dtos.rejection,
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

    it('should trim the rejection reason before saving it', async () => {
        context.transactionMock.appointment.findUnique
            .mockResolvedValueOnce(context.appointment)
            .mockResolvedValueOnce(context.rejectedAppointment);

        await service.rejectAppointment(
            LIFECYCLE_TEST_IDS.appointment,
            LIFECYCLE_TEST_IDS.staff,
            context.dtos.rejection,
        );

        expect(
            context.transactionMock.appointmentHistory.create,
        ).toHaveBeenCalledWith({
            data: expect.objectContaining({
                reason: LIFECYCLE_TEST_REASONS.rejection,
            }),
        });
    });

    it('should reject when the conditional update does not affect exactly one record', async () => {
        context.transactionMock.appointment.updateMany.mockResolvedValue({
            count: 0,
        });

        await expect(
            service.rejectAppointment(
                LIFECYCLE_TEST_IDS.appointment,
                LIFECYCLE_TEST_IDS.staff,
                context.dtos.rejection,
            ),
        ).rejects.toThrow(
            new BadRequestException(
                'Appointment is no longer pending or has expired',
            ),
        );

        expect(
            context.transactionMock.appointmentHistory.create,
        ).not.toHaveBeenCalled();
    });

    it('should execute the rejection operation inside a transaction', async () => {
        await service.rejectAppointment(
            LIFECYCLE_TEST_IDS.appointment,
            LIFECYCLE_TEST_IDS.staff,
            context.dtos.rejection,
        );

        expect(
            context.prismaMock.client.$transaction,
        ).toHaveBeenCalledTimes(1);
    });
});