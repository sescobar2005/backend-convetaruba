import {
    BadRequestException,
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';
import {
    AppointmentHistoryAction,
    AppointmentStatus,
} from '../../../../generated/prisma/enums.js';
import { beforeEach, describe, expect, it } from 'vitest';
import {
    createLifecycleTestContext,
    LIFECYCLE_TEST_IDS,
    LIFECYCLE_TEST_REASONS,
} from './lifecycle-test.utils.js';
import { AppointmentCompletionService } from '../../services/lifecycle/appointment-completion.service.js';

describe('AppointmentCompletionService', () => {
    let context: ReturnType<typeof createLifecycleTestContext>;
    let service: AppointmentCompletionService;

    beforeEach(() => {
        context = createLifecycleTestContext();
        service = new AppointmentCompletionService(
            context.prismaServiceMock,
        );
    });

    it('should complete an appointment and create its medical record', async () => {
        context.transactionMock.appointment.findUnique
            .mockResolvedValueOnce(context.inProgressAppointment)
            .mockResolvedValueOnce(context.completedAppointment);

        const result = await service.completeAppointment(
            LIFECYCLE_TEST_IDS.appointment,
            LIFECYCLE_TEST_IDS.veterinarianUser,
            context.dtos.completion,
        );

        expect(
            context.transactionMock.appointment.updateMany,
        ).toHaveBeenCalledWith({
            where: {
                idAppointment: LIFECYCLE_TEST_IDS.appointment,
                veterinarianId: LIFECYCLE_TEST_IDS.veterinarian,
                status: AppointmentStatus.IN_PROGRESS,
            },
            data: {
                status: AppointmentStatus.COMPLETED,
                completedAt: expect.any(Date),
            },
        });

        expect(
            context.transactionMock.medicalRecord.create,
        ).toHaveBeenCalledWith({
            data: {
                appointmentId: LIFECYCLE_TEST_IDS.appointment,
                petId: LIFECYCLE_TEST_IDS.pet,
                veterinarianId: LIFECYCLE_TEST_IDS.veterinarian,
                observations: 'Patient examined',
                diagnosis: 'Healthy',
                treatment: 'Routine care',
                recommendations: 'Regular checkups',
            },
        });

        expect(
            context.transactionMock.appointmentHistory.create,
        ).toHaveBeenCalledWith({
            data: expect.objectContaining({
                appointmentId: LIFECYCLE_TEST_IDS.appointment,
                action: AppointmentHistoryAction.COMPLETED,
                performedByUserId:
                    LIFECYCLE_TEST_IDS.veterinarianUser,
                reason: LIFECYCLE_TEST_REASONS.completion,
                newData: {
                    status: AppointmentStatus.COMPLETED,
                    completedAt: expect.any(String),
                },
            }),
        });

        expect(result).toEqual(context.completedAppointment);
    });

    it('should throw NotFoundException when the appointment does not exist', async () => {
        context.transactionMock.appointment.findUnique.mockResolvedValue(null);

        await expect(
            service.completeAppointment(
                LIFECYCLE_TEST_IDS.appointment,
                LIFECYCLE_TEST_IDS.veterinarianUser,
                context.dtos.completion,
            ),
        ).rejects.toThrow(
            new NotFoundException('Appointment not found'),
        );

        expect(
            context.transactionMock.appointment.updateMany,
        ).not.toHaveBeenCalled();

        expect(
            context.transactionMock.medicalRecord.create,
        ).not.toHaveBeenCalled();

        expect(
            context.transactionMock.appointmentHistory.create,
        ).not.toHaveBeenCalled();
    });

    it('should reject completion by a veterinarian who is not assigned to the appointment', async () => {
        context.transactionMock.appointment.findUnique.mockResolvedValue(
            context.inProgressAppointment,
        );

        await expect(
            service.completeAppointment(
                LIFECYCLE_TEST_IDS.appointment,
                'another-veterinarian-user-id',
                context.dtos.completion,
            ),
        ).rejects.toThrow(
            new ForbiddenException(
                'Only the assigned veterinarian can complete this appointment',
            ),
        );

        expect(
            context.transactionMock.appointment.updateMany,
        ).not.toHaveBeenCalled();

        expect(
            context.transactionMock.medicalRecord.create,
        ).not.toHaveBeenCalled();
    });

    it('should reject appointments that are not in progress', async () => {
        context.transactionMock.appointment.findUnique.mockResolvedValue(
            context.confirmedAppointment,
        );

        await expect(
            service.completeAppointment(
                LIFECYCLE_TEST_IDS.appointment,
                LIFECYCLE_TEST_IDS.veterinarianUser,
                context.dtos.completion,
            ),
        ).rejects.toThrow(
            new BadRequestException(
                'Only appointments in progress can be completed',
            ),
        );

        expect(
            context.transactionMock.appointment.updateMany,
        ).not.toHaveBeenCalled();

        expect(
            context.transactionMock.medicalRecord.create,
        ).not.toHaveBeenCalled();
    });

    it('should reject when the conditional update does not affect exactly one record', async () => {
        context.transactionMock.appointment.findUnique.mockResolvedValue(
            context.inProgressAppointment,
        );

        context.transactionMock.appointment.updateMany.mockResolvedValue({
            count: 0,
        });

        await expect(
            service.completeAppointment(
                LIFECYCLE_TEST_IDS.appointment,
                LIFECYCLE_TEST_IDS.veterinarianUser,
                context.dtos.completion,
            ),
        ).rejects.toThrow(
            new BadRequestException(
                'Appointment status changed before it could be completed',
            ),
        );

        expect(
            context.transactionMock.medicalRecord.create,
        ).not.toHaveBeenCalled();

        expect(
            context.transactionMock.appointmentHistory.create,
        ).not.toHaveBeenCalled();
    });

    it('should trim medical record fields before saving them', async () => {
        context.transactionMock.appointment.findUnique
            .mockResolvedValueOnce(context.inProgressAppointment)
            .mockResolvedValueOnce(context.completedAppointment);

        await service.completeAppointment(
            LIFECYCLE_TEST_IDS.appointment,
            LIFECYCLE_TEST_IDS.veterinarianUser,
            context.dtos.completion,
        );

        expect(
            context.transactionMock.medicalRecord.create,
        ).toHaveBeenCalledWith({
            data: expect.objectContaining({
                observations: 'Patient examined',
                diagnosis: 'Healthy',
                treatment: 'Routine care',
                recommendations: 'Regular checkups',
            }),
        });
    });

    it('should execute the completion operation inside a transaction', async () => {
        context.transactionMock.appointment.findUnique
            .mockResolvedValueOnce(context.inProgressAppointment)
            .mockResolvedValueOnce(context.completedAppointment);

        await service.completeAppointment(
            LIFECYCLE_TEST_IDS.appointment,
            LIFECYCLE_TEST_IDS.veterinarianUser,
            context.dtos.completion,
        );

        expect(
            context.prismaMock.client.$transaction,
        ).toHaveBeenCalledTimes(1);
    });
});