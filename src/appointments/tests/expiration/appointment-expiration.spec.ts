import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import {
    AppointmentHistoryAction,
    AppointmentStatus,
} from '../../../../generated/prisma/enums.js';

import { AppointmentExpirationService } from '../../services/appointment-expiration.service.js';
import {
    EXPIRATION_TEST_FIXTURES,
    EXPIRATION_TEST_IDS,
    createExpirationTestContext,
} from './expiration-test.utils.js';

describe('AppointmentExpirationService', () => {
    let context: ReturnType<typeof createExpirationTestContext>;
    let service: AppointmentExpirationService;

    const now = new Date('2030-05-06T12:15:00.000Z');

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(now);

        context = createExpirationTestContext();
        service = new AppointmentExpirationService(context.prismaMock);

        context.transactionMock.appointment.findMany.mockResolvedValue([
            EXPIRATION_TEST_FIXTURES.pendingAppointment,
        ]);

        context.transactionMock.appointment.updateMany.mockResolvedValue({
            count: 1,
        });

        context.transactionMock.appointmentHistory.create.mockResolvedValue(
            {},
        );
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('expireAppointments', () => {
        it('should expire pending appointments', async () => {
            const result = await service.expireAppointments();

            expect(result).toEqual({ expiredCount: 1 });

            expect(
                context.transactionMock.appointment.updateMany,
            ).toHaveBeenCalledWith({
                where: {
                    idAppointment: EXPIRATION_TEST_IDS.appointment,
                    status: AppointmentStatus.PENDING,
                    confirmationExpiresAt: { lte: now },
                },
                data: {
                    status: AppointmentStatus.EXPIRED,
                },
            });
        });

        it('should create a history record when an appointment expires', async () => {
            await service.expireAppointments();

            expect(
                context.transactionMock.appointmentHistory.create,
            ).toHaveBeenCalledWith({
                data: {
                    appointmentId: EXPIRATION_TEST_IDS.appointment,
                    action: AppointmentHistoryAction.EXPIRED,
                    reason:
                        'Appointment request expired after 15 minutes without confirmation',
                },
            });
        });

        it('should return zero when there are no expired appointments', async () => {
            context.transactionMock.appointment.findMany.mockResolvedValue([]);

            const result = await service.expireAppointments();

            expect(result).toEqual({ expiredCount: 0 });
            expect(
                context.transactionMock.appointment.updateMany,
            ).not.toHaveBeenCalled();
            expect(
                context.transactionMock.appointmentHistory.create,
            ).not.toHaveBeenCalled();
        });

        it('should not create history when the appointment was not updated', async () => {
            context.transactionMock.appointment.updateMany.mockResolvedValue({
                count: 0,
            });

            const result = await service.expireAppointments();

            expect(result).toEqual({ expiredCount: 0 });
            expect(
                context.transactionMock.appointmentHistory.create,
            ).not.toHaveBeenCalled();
        });

        it('should use the current date to find expired appointments', async () => {
            await service.expireAppointments();

            expect(
                context.transactionMock.appointment.findMany,
            ).toHaveBeenCalledWith({
                where: {
                    status: AppointmentStatus.PENDING,
                    confirmationExpiresAt: { lte: now },
                },
                select: {
                    idAppointment: true,
                },
            });
        });
    });

    describe('expirePendingAppointments', () => {
        it('should expire pending appointments for the specified veterinarian', async () => {
            await service.expirePendingAppointments(
                context.transactionMock as never,
                EXPIRATION_TEST_IDS.veterinarian,
                now,
            );

            expect(
                context.transactionMock.appointment.findMany,
            ).toHaveBeenCalledWith({
                where: {
                    veterinarianId: EXPIRATION_TEST_IDS.veterinarian,
                    status: AppointmentStatus.PENDING,
                    confirmationExpiresAt: { lte: now },
                },
                select: {
                    idAppointment: true,
                },
            });
        });

        it('should create a history record when an appointment is successfully expired', async () => {
            await service.expirePendingAppointments(
                context.transactionMock as never,
                EXPIRATION_TEST_IDS.veterinarian,
                now,
            );

            expect(
                context.transactionMock.appointmentHistory.create,
            ).toHaveBeenCalledWith({
                data: {
                    appointmentId: EXPIRATION_TEST_IDS.appointment,
                    action: AppointmentHistoryAction.EXPIRED,
                    reason:
                        'Appointment request expired after 15 minutes without confirmation',
                },
            });
        });

        it('should not create history when the appointment was not updated', async () => {
            context.transactionMock.appointment.updateMany.mockResolvedValue({
                count: 0,
            });

            await service.expirePendingAppointments(
                context.transactionMock as never,
                EXPIRATION_TEST_IDS.veterinarian,
                now,
            );

            expect(
                context.transactionMock.appointmentHistory.create,
            ).not.toHaveBeenCalled();
        });

        it('should not update appointments when there are no expired requests', async () => {
            context.transactionMock.appointment.findMany.mockResolvedValue([]);

            await service.expirePendingAppointments(
                context.transactionMock as never,
                EXPIRATION_TEST_IDS.veterinarian,
                now,
            );

            expect(
                context.transactionMock.appointment.updateMany,
            ).not.toHaveBeenCalled();
            expect(
                context.transactionMock.appointmentHistory.create,
            ).not.toHaveBeenCalled();
        });
    });
});