import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
    AppointmentHistoryAction,
    AppointmentStatus,
    StaffPosition
} from '../../../../generated/prisma/enums.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    LIFECYCLE_TEST_DATES,
    LIFECYCLE_TEST_IDS,
    LIFECYCLE_TEST_REASONS,
    createLifecycleTestContext,
} from './lifecycle-test.utils.js';
import { AppointmentConfirmationService } from '../../services/lifecycle/appointment-confirmation.service.js';

describe('AppointmentConfirmationService', () => {
    let context: ReturnType<typeof createLifecycleTestContext>;
    let service: AppointmentConfirmationService;

    beforeEach(() => {
        vi.useRealTimers();

        context = createLifecycleTestContext();

        service = new AppointmentConfirmationService(
            context.prismaServiceMock,
        );
    });

    it('should confirm a valid pending appointment', async () => {
        context.transactionMock.appointment.findUnique
            .mockResolvedValueOnce(context.appointment)
            .mockResolvedValueOnce(context.confirmedAppointment);

        const result = await service.confirmAppointment(
            LIFECYCLE_TEST_IDS.appointment,
            LIFECYCLE_TEST_IDS.staff,
            context.dtos.confirmation,
        );

        expect(result).toEqual(context.confirmedAppointment);

        expect(
            context.transactionMock.appointment.updateMany,
        ).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    idAppointment: LIFECYCLE_TEST_IDS.appointment,
                    status: AppointmentStatus.PENDING,
                }),
                data: expect.objectContaining({
                    endsAt: LIFECYCLE_TEST_DATES.endsAt,
                    status: AppointmentStatus.CONFIRMED,
                }),
            }),
        );

        expect(
            context.transactionMock.appointmentHistory.create,
        ).toHaveBeenCalledWith({
            data: {
                appointmentId: LIFECYCLE_TEST_IDS.appointment,
                action: AppointmentHistoryAction.CONFIRMED,
                reason: 'Appointment confirmed by staff',
                performedByUserId: LIFECYCLE_TEST_IDS.staff,
            },
        });
    });

    it('should throw NotFoundException when the appointment does not exist', async () => {
        context.transactionMock.appointment.findUnique.mockResolvedValue(null);

        await expect(
            service.confirmAppointment(
                LIFECYCLE_TEST_IDS.appointment,
                LIFECYCLE_TEST_IDS.staff,
                context.dtos.confirmation,
            ),
        ).rejects.toThrow(
            new NotFoundException('Appointment not found'),
        );

        expect(
            context.transactionMock.appointment.updateMany,
        ).not.toHaveBeenCalled();
    });

    it('should reject an invalid end date', async () => {
        await expect(
            service.confirmAppointment(
                LIFECYCLE_TEST_IDS.appointment,
                LIFECYCLE_TEST_IDS.staff,
                {
                    endsAt: 'invalid-date',
                },
            ),
        ).rejects.toThrow(
            new BadRequestException('Invalid appointment end date'),
        );

        expect(
            context.prismaMock.client.$transaction,
        ).not.toHaveBeenCalled();
    });

    it('should reject an end date without timezone information', async () => {
        await expect(
            service.confirmAppointment(
                LIFECYCLE_TEST_IDS.appointment,
                LIFECYCLE_TEST_IDS.staff,
                {
                    endsAt: '2035-05-14T15:00:00',
                },
            ),
        ).rejects.toThrow(
            new BadRequestException(
                'Appointment end time must include a timezone',
            ),
        );

        expect(
            context.prismaMock.client.$transaction,
        ).not.toHaveBeenCalled();
    });

    it('should reject appointments that are not pending', async () => {
        context.transactionMock.appointment.findUnique.mockResolvedValue({
            ...context.appointment,
            status: AppointmentStatus.CONFIRMED,
        });

        await expect(
            service.confirmAppointment(
                LIFECYCLE_TEST_IDS.appointment,
                LIFECYCLE_TEST_IDS.staff,
                context.dtos.confirmation,
            ),
        ).rejects.toThrow(
            new BadRequestException(
                'Only pending appointments can be confirmed',
            ),
        );

        expect(
            context.transactionMock.appointment.updateMany,
        ).not.toHaveBeenCalled();
    });

    it('should reject appointments whose confirmation period has expired', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2035-05-14T17:00:00.000Z'));

        context.transactionMock.appointment.findUnique.mockResolvedValue({
            ...context.appointment,
            confirmationExpiresAt: new Date('2035-05-14T16:00:00.000Z'),
        });

        await expect(
            service.confirmAppointment(
                LIFECYCLE_TEST_IDS.appointment,
                LIFECYCLE_TEST_IDS.staff,
                context.dtos.confirmation,
            ),
        ).rejects.toThrow(
            new BadRequestException(
                'Appointment confirmation period has expired',
            ),
        );

        expect(
            context.transactionMock.appointment.updateMany,
        ).toHaveBeenCalledWith(
            expect.objectContaining({
                data: {
                    status: AppointmentStatus.EXPIRED,
                },
            }),
        );

        expect(
            context.transactionMock.appointmentHistory.create,
        ).toHaveBeenCalledWith({
            data: {
                appointmentId: LIFECYCLE_TEST_IDS.appointment,
                action: AppointmentHistoryAction.EXPIRED,
                reason: LIFECYCLE_TEST_REASONS.expiration,
            },
        });
    });

    it('should reject an end date that is before or equal to the appointment start', async () => {
        await expect(
            service.confirmAppointment(
                LIFECYCLE_TEST_IDS.appointment,
                LIFECYCLE_TEST_IDS.staff,
                {
                    endsAt: LIFECYCLE_TEST_DATES.startsAt.toISOString(),
                },
            ),
        ).rejects.toThrow(
            new BadRequestException(
                'Appointment end time must be after its start time',
            ),
        );
    });

    it('should reject an end date that is in the past', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2035-05-14T15:30:00.000Z'));

        context.transactionMock.appointment.findUnique.mockResolvedValue({
            ...context.appointment,
            confirmationExpiresAt: new Date('2035-05-14T16:00:00.000Z'),
        });

        await expect(
            service.confirmAppointment(
                LIFECYCLE_TEST_IDS.appointment,
                LIFECYCLE_TEST_IDS.staff,
                context.dtos.confirmation,
            ),
        ).rejects.toThrow(
            new BadRequestException(
                'Appointment end time must be in the future',
            ),
        );
    });

    it('should reject appointments when the branch is inactive', async () => {
        context.transactionMock.appointment.findUnique.mockResolvedValue({
            ...context.appointment,
            branch: {
                ...context.appointment.branch,
                isActive: false,
            },
        });

        await expect(
            service.confirmAppointment(
                LIFECYCLE_TEST_IDS.appointment,
                LIFECYCLE_TEST_IDS.staff,
                context.dtos.confirmation,
            ),
        ).rejects.toThrow(
            new BadRequestException(
                'Branch or veterinarian is no longer available',
            ),
        );
    });

    it('should reject appointments when the veterinarian is inactive', async () => {
        context.transactionMock.appointment.findUnique.mockResolvedValue({
            ...context.appointment,
            veterinarian: {
                ...context.appointment.veterinarian,
                isActive: false,
            },
        });

        await expect(
            service.confirmAppointment(
                LIFECYCLE_TEST_IDS.appointment,
                LIFECYCLE_TEST_IDS.staff,
                context.dtos.confirmation,
            ),
        ).rejects.toThrow(
            new BadRequestException(
                'Branch or veterinarian is no longer available',
            ),
        );
    });

    it('should reject appointments when the assigned staff member is not a veterinarian', async () => {
        context.transactionMock.appointment.findUnique.mockResolvedValue({
            ...context.appointment,
            veterinarian: {
                ...context.appointment.veterinarian,
                position: StaffPosition.ASSISTANT,
            },
        });

        await expect(
            service.confirmAppointment(
                LIFECYCLE_TEST_IDS.appointment,
                LIFECYCLE_TEST_IDS.staff,
                context.dtos.confirmation,
            ),
        ).rejects.toThrow(
            new BadRequestException(
                'Branch or veterinarian is no longer available',
            ),
        );
    });

    it('should reject appointments when the veterinarian is not assigned to the branch', async () => {
        context.transactionMock.staffBranch.findFirst.mockResolvedValue(null);

        await expect(
            service.confirmAppointment(
                LIFECYCLE_TEST_IDS.appointment,
                LIFECYCLE_TEST_IDS.staff,
                context.dtos.confirmation,
            ),
        ).rejects.toThrow(
            new BadRequestException(
                'Veterinarian is no longer assigned to this branch',
            ),
        );

        expect(
            context.transactionMock.staffSchedule.findMany,
        ).not.toHaveBeenCalled();
    });

    it('should reject appointments outside the veterinarian working schedule', async () => {
        context.transactionMock.staffSchedule.findMany.mockResolvedValue([
            {
                startsAt: '11:00',
                endsAt: '12:00',
            },
        ]);

        await expect(
            service.confirmAppointment(
                LIFECYCLE_TEST_IDS.appointment,
                LIFECYCLE_TEST_IDS.staff,
                context.dtos.confirmation,
            ),
        ).rejects.toThrow(
            new BadRequestException(
                'Appointment duration exceeds the veterinarian working schedule',
            ),
        );
    });

    it('should reject appointments when another appointment overlaps the requested period', async () => {
        context.transactionMock.appointment.findFirst.mockResolvedValue({
            idAppointment: 'conflicting-appointment-id',
        });

        await expect(
            service.confirmAppointment(
                LIFECYCLE_TEST_IDS.appointment,
                LIFECYCLE_TEST_IDS.staff,
                context.dtos.confirmation,
            ),
        ).rejects.toThrow(
            new BadRequestException(
                'Veterinarian already has another appointment during this period',
            ),
        );
    });

    it('should reject appointments when the veterinarian has a scheduled block', async () => {
        context.transactionMock.appointmentBlock.findFirst.mockResolvedValue({
            idAppointmentBlock: 'appointment-block-test-id',
        });

        await expect(
            service.confirmAppointment(
                LIFECYCLE_TEST_IDS.appointment,
                LIFECYCLE_TEST_IDS.staff,
                context.dtos.confirmation,
            ),
        ).rejects.toThrow(
            new BadRequestException(
                'Veterinarian has a scheduled block during this period',
            ),
        );
    });

    it('should reject appointments that extend beyond the branch working day', async () => {
        await expect(
            service.confirmAppointment(
                LIFECYCLE_TEST_IDS.appointment,
                LIFECYCLE_TEST_IDS.staff,
                {
                    endsAt: '2035-05-15T04:01:00.000Z',
                },
            ),
        ).rejects.toThrow(
            new BadRequestException(
                'Appointment cannot extend beyond the branch working day',
            ),
        );
    });

    it('should reject appointments when the conditional update does not affect exactly one record', async () => {
        context.transactionMock.appointment.updateMany.mockResolvedValue({
            count: 0,
        });

        await expect(
            service.confirmAppointment(
                LIFECYCLE_TEST_IDS.appointment,
                LIFECYCLE_TEST_IDS.staff,
                context.dtos.confirmation,
            ),
        ).rejects.toThrow(
            new BadRequestException(
                'Appointment could not be confirmed because its status changed',
            ),
        );

        expect(
            context.transactionMock.appointmentHistory.create,
        ).not.toHaveBeenCalled();
    });

    it('should execute the confirmation operation inside a transaction', async () => {
        context.transactionMock.appointment.findUnique
            .mockResolvedValueOnce(context.appointment)
            .mockResolvedValueOnce(context.confirmedAppointment);

        await service.confirmAppointment(
            LIFECYCLE_TEST_IDS.appointment,
            LIFECYCLE_TEST_IDS.staff,
            context.dtos.confirmation,
        );

        expect(context.prismaMock.client.$transaction).toHaveBeenCalledTimes(1);
    });
});