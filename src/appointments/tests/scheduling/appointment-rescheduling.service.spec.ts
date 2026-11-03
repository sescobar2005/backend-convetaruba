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

import {
    SCHEDULING_TEST_DATES,
    SCHEDULING_TEST_FIXTURES,
    SCHEDULING_TEST_IDS,
    createSchedulingTestContext,
} from './scheduling-test.utils.js';
import { AppointmentReschedulingService } from '../../services/scheduling/appointment-rescheduling.service.js';

describe('AppointmentReschedulingService', () => {
    let context: ReturnType<typeof createSchedulingTestContext>;
    let service: AppointmentReschedulingService;

    const appointmentId = SCHEDULING_TEST_IDS.appointment;
    const requestingUserId = SCHEDULING_TEST_IDS.customer;

    type ReschedulingDto = Parameters<
        AppointmentReschedulingService['rescheduleAppointment']
    >[3];

    const validDto: ReschedulingDto = {
        branchId: SCHEDULING_TEST_IDS.branch,
        veterinarianId: SCHEDULING_TEST_IDS.veterinarian,
        startsAt: '2035-05-14T15:00:00.000Z',
    };

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(SCHEDULING_TEST_DATES.now);

        context = createSchedulingTestContext();

        service = new AppointmentReschedulingService(
            context.prismaMock,
            context.expirationServiceMock as never,
        );

        context.transactionMock.appointment.findUnique.mockResolvedValue(
            SCHEDULING_TEST_FIXTURES.appointment,
        );

        context.transactionMock.branch.findUnique.mockResolvedValue(
            SCHEDULING_TEST_FIXTURES.branch,
        );

        context.transactionMock.staff.findUnique.mockResolvedValue(
            SCHEDULING_TEST_FIXTURES.veterinarian,
        );

        context.transactionMock.branchService.findFirst.mockResolvedValue(
            SCHEDULING_TEST_FIXTURES.branchService,
        );

        context.transactionMock.staffBranch.findFirst.mockResolvedValue(
            SCHEDULING_TEST_FIXTURES.assignment,
        );

        context.transactionMock.staffSchedule.findMany.mockResolvedValue([
            SCHEDULING_TEST_FIXTURES.schedule,
        ]);

        context.transactionMock.appointment.findFirst.mockResolvedValue(null);

        context.transactionMock.appointmentBlock.findFirst.mockResolvedValue(
            null,
        );

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

    describe('rescheduleAppointment', () => {
        it('should reschedule a pending appointment successfully', async () => {
            const result = await service.rescheduleAppointment(
                appointmentId,
                requestingUserId,
                false,
                validDto,
            );

            expect(result).toEqual(
                SCHEDULING_TEST_FIXTURES.appointment,
            );

            expect(
                context.transactionMock.appointment.updateMany,
            ).toHaveBeenCalledWith({
                where: expect.objectContaining({
                    idAppointment: appointmentId,
                    status: AppointmentStatus.PENDING,
                }),
                data: {
                    branchId: validDto.branchId,
                    veterinarianId: validDto.veterinarianId,
                    startsAt: new Date(validDto.startsAt),
                    endsAt: new Date('2035-05-14T15:20:00.000Z'),
                },
            });
        });

        it('should allow staff to reschedule an appointment', async () => {
            await service.rescheduleAppointment(
                appointmentId,
                '12345678-1234-4234-8234-123456789abc',
                true,
                validDto,
            );

            expect(
                context.transactionMock.appointment.updateMany,
            ).toHaveBeenCalled();
        });

        it('should reject an appointment that does not exist', async () => {
            context.transactionMock.appointment.findUnique.mockResolvedValue(
                null,
            );

            await expect(
                service.rescheduleAppointment(
                    appointmentId,
                    requestingUserId,
                    false,
                    validDto,
                ),
            ).rejects.toThrow('Appointment not found');

            expect(
                context.transactionMock.appointment.updateMany,
            ).not.toHaveBeenCalled();
        });

        it('should reject a customer who does not own the appointment', async () => {
            context.transactionMock.appointment.findUnique.mockResolvedValue({
                ...SCHEDULING_TEST_FIXTURES.appointment,
                customerId: '12345678-1234-4234-8234-123456789abc',
            });

            await expect(
                service.rescheduleAppointment(
                    appointmentId,
                    requestingUserId,
                    false,
                    validDto,
                ),
            ).rejects.toThrow('Appointment not found');

            expect(
                context.transactionMock.appointment.updateMany,
            ).not.toHaveBeenCalled();
        });

        it('should allow staff to reschedule another customer appointment', async () => {
            context.transactionMock.appointment.findUnique.mockResolvedValue({
                ...SCHEDULING_TEST_FIXTURES.appointment,
                customerId: '12345678-1234-4234-8234-123456789abc',
            });

            await service.rescheduleAppointment(
                appointmentId,
                '12345678-1234-4234-8234-123456789abc',
                true,
                validDto,
            );

            expect(
                context.transactionMock.appointment.updateMany,
            ).toHaveBeenCalled();
        });

        it('should reject an appointment that cannot be rescheduled', async () => {
            context.transactionMock.appointment.findUnique.mockResolvedValue({
                ...SCHEDULING_TEST_FIXTURES.appointment,
                status: AppointmentStatus.COMPLETED,
            });

            await expect(
                service.rescheduleAppointment(
                    appointmentId,
                    requestingUserId,
                    false,
                    validDto,
                ),
            ).rejects.toThrow(
                'Only pending or confirmed appointments can be rescheduled',
            );

            expect(
                context.transactionMock.appointment.updateMany,
            ).not.toHaveBeenCalled();
        });

        it('should reject an expired pending appointment', async () => {
            context.transactionMock.appointment.findUnique.mockResolvedValue({
                ...SCHEDULING_TEST_FIXTURES.appointment,
                confirmationExpiresAt: new Date(
                    '2035-05-14T11:59:00.000Z',
                ),
            });

            await expect(
                service.rescheduleAppointment(
                    appointmentId,
                    requestingUserId,
                    false,
                    validDto,
                ),
            ).rejects.toThrow('Appointment request has expired');

            expect(
                context.transactionMock.branch.findUnique,
            ).not.toHaveBeenCalled();
        });

        it('should reject an invalid new start date', async () => {
            const dto = {
                ...validDto,
                startsAt: 'invalid-date',
            };

            await expect(
                service.rescheduleAppointment(
                    appointmentId,
                    requestingUserId,
                    false,
                    dto,
                ),
            ).rejects.toThrow('Invalid appointment start date');

            expect(
                context.transactionMock.appointment.findUnique,
            ).not.toHaveBeenCalled();
        });

        it('should reject a new start date without a timezone', async () => {
            const dto = {
                ...validDto,
                startsAt: '2035-05-14T15:00:00',
            };

            await expect(
                service.rescheduleAppointment(
                    appointmentId,
                    requestingUserId,
                    false,
                    dto,
                ),
            ).rejects.toThrow(
                'Appointment start date must include a timezone',
            );
        });

        it('should reject a new start date in the past', async () => {
            const dto = {
                ...validDto,
                startsAt: '2035-05-14T11:00:00.000Z',
            };

            await expect(
                service.rescheduleAppointment(
                    appointmentId,
                    requestingUserId,
                    false,
                    dto,
                ),
            ).rejects.toThrow(
                'Appointment start date must be in the future',
            );
        });

        it('should reject an unavailable branch', async () => {
            context.transactionMock.branch.findUnique.mockResolvedValue({
                ...SCHEDULING_TEST_FIXTURES.branch,
                isActive: false,
            });

            await expect(
                service.rescheduleAppointment(
                    appointmentId,
                    requestingUserId,
                    false,
                    validDto,
                ),
            ).rejects.toThrow('Selected branch is unavailable');

            expect(
                context.transactionMock.staff.findUnique,
            ).not.toHaveBeenCalled();
        });

        it('should reject an unavailable veterinarian', async () => {
            context.transactionMock.staff.findUnique.mockResolvedValue({
                ...SCHEDULING_TEST_FIXTURES.veterinarian,
                isActive: false,
            });

            await expect(
                service.rescheduleAppointment(
                    appointmentId,
                    requestingUserId,
                    false,
                    validDto,
                ),
            ).rejects.toThrow(
                'Selected veterinarian is unavailable',
            );

            expect(
                context.transactionMock.branchService.findFirst,
            ).not.toHaveBeenCalled();
        });

        it('should reject a service unavailable at the selected branch', async () => {
            context.transactionMock.branchService.findFirst.mockResolvedValue(
                null,
            );

            await expect(
                service.rescheduleAppointment(
                    appointmentId,
                    requestingUserId,
                    false,
                    validDto,
                ),
            ).rejects.toThrow(
                'The appointment service is unavailable at the selected branch',
            );

            expect(
                context.transactionMock.staffBranch.findFirst,
            ).not.toHaveBeenCalled();
        });

        it('should reject a veterinarian not assigned to the selected branch', async () => {
            context.transactionMock.staffBranch.findFirst.mockResolvedValue(
                null,
            );

            await expect(
                service.rescheduleAppointment(
                    appointmentId,
                    requestingUserId,
                    false,
                    validDto,
                ),
            ).rejects.toThrow(
                'Veterinarian is not assigned to the selected branch at that time',
            );

            expect(
                context.transactionMock.staffSchedule.findMany,
            ).not.toHaveBeenCalled();
        });

        it('should reject a new time outside the veterinarian schedule', async () => {
            context.transactionMock.staffSchedule.findMany.mockResolvedValue([
                {
                    startsAt: '08:00',
                    endsAt: '10:30',
                },
            ]);

            await expect(
                service.rescheduleAppointment(
                    appointmentId,
                    requestingUserId,
                    false,
                    validDto,
                ),
            ).rejects.toThrow(
                'The new appointment time is outside the veterinarian schedule',
            );

            expect(
                context.transactionMock.appointment.updateMany,
            ).not.toHaveBeenCalled();
        });

        it('should preserve the original duration of a confirmed appointment', async () => {
            context.transactionMock.appointment.findUnique.mockResolvedValue({
                ...SCHEDULING_TEST_FIXTURES.appointment,
                status: AppointmentStatus.CONFIRMED,
                endsAt: new Date('2035-05-14T14:45:00.000Z'),
            });

            await service.rescheduleAppointment(
                appointmentId,
                requestingUserId,
                false,
                validDto,
            );

            expect(
                context.transactionMock.appointment.updateMany,
            ).toHaveBeenCalledWith({
                where: expect.objectContaining({
                    idAppointment: appointmentId,
                    status: AppointmentStatus.CONFIRMED,
                }),
                data: expect.objectContaining({
                    startsAt: new Date(validDto.startsAt),
                    endsAt: new Date('2035-05-14T15:45:00.000Z'),
                }),
            });
        });

        it('should expire pending appointments for the selected veterinarian', async () => {
            await service.rescheduleAppointment(
                appointmentId,
                requestingUserId,
                false,
                validDto,
            );

            expect(
                context.expirationServiceMock.expirePendingAppointments,
            ).toHaveBeenCalledWith(
                context.transactionMock,
                validDto.veterinarianId,
                SCHEDULING_TEST_DATES.now,
            );
        });

        it('should reject a time that conflicts with another appointment', async () => {
            context.transactionMock.appointment.findFirst.mockResolvedValue({
                idAppointment: '12345678-1234-4234-8234-123456789abc',
            });

            await expect(
                service.rescheduleAppointment(
                    appointmentId,
                    requestingUserId,
                    false,
                    validDto,
                ),
            ).rejects.toThrow(
                'The veterinarian already has another appointment at that time',
            );

            expect(
                context.transactionMock.appointment.updateMany,
            ).not.toHaveBeenCalled();
        });

        it('should reject a time that conflicts with a scheduled block', async () => {
            context.transactionMock.appointmentBlock.findFirst.mockResolvedValue(
                {
                    idAppointmentBlock:
                        '12345678-1234-4234-8234-123456789abc',
                },
            );

            await expect(
                service.rescheduleAppointment(
                    appointmentId,
                    requestingUserId,
                    false,
                    validDto,
                ),
            ).rejects.toThrow(
                'The veterinarian has a blocked period at that time',
            );

            expect(
                context.transactionMock.appointment.updateMany,
            ).not.toHaveBeenCalled();
        });

        it('should reject rescheduling when the appointment changes concurrently', async () => {
            context.transactionMock.appointment.updateMany.mockResolvedValue({
                count: 0,
            });

            await expect(
                service.rescheduleAppointment(
                    appointmentId,
                    requestingUserId,
                    false,
                    validDto,
                ),
            ).rejects.toThrow(
                'Appointment changed before rescheduling could be completed',
            );

            expect(
                context.transactionMock.appointmentHistory.create,
            ).not.toHaveBeenCalled();
        });

        it('should create a rescheduling history record', async () => {
            await service.rescheduleAppointment(
                appointmentId,
                requestingUserId,
                false,
                validDto,
            );

            expect(
                context.transactionMock.appointmentHistory.create,
            ).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    appointmentId,
                    action: AppointmentHistoryAction.RESCHEDULED,
                    performedByUserId: requestingUserId,
                    reason: expect.any(String),
                }),
            });
        });

        it('should propagate errors when updating the appointment', async () => {
            const databaseError = new Error(
                'Appointment update failed',
            );

            context.transactionMock.appointment.updateMany.mockRejectedValueOnce(
                databaseError,
            );

            await expect(
                service.rescheduleAppointment(
                    appointmentId,
                    requestingUserId,
                    false,
                    validDto,
                ),
            ).rejects.toThrow(databaseError);

            expect(
                context.transactionMock.appointmentHistory.create,
            ).not.toHaveBeenCalled();
        });
    });
});