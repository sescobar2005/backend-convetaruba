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
import { AppointmentVeterinarianService } from '../../services/scheduling/appointment-veterinarian.service.js';

describe('AppointmentVeterinarianService', () => {
    let context: ReturnType<typeof createSchedulingTestContext>;
    let service: AppointmentVeterinarianService;

    const appointmentId = SCHEDULING_TEST_IDS.appointment;
    const changedByUserId = SCHEDULING_TEST_IDS.customer;
    const newVeterinarianId = '12345678-1234-4234-8234-123456789abc';

    type ChangeVeterinarianDto = Parameters<
        AppointmentVeterinarianService['changeVeterinarian']
    >[2];

    const validDto: ChangeVeterinarianDto = {
        veterinarianId: newVeterinarianId,
    };

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(SCHEDULING_TEST_DATES.now);

        context = createSchedulingTestContext();

        service = new AppointmentVeterinarianService(
            context.prismaMock,
            context.expirationServiceMock as never,
        );

        context.transactionMock.appointment.findUnique.mockResolvedValue(
            SCHEDULING_TEST_FIXTURES.appointment,
        );

        context.transactionMock.branch.findUnique.mockResolvedValue(
            SCHEDULING_TEST_FIXTURES.branch,
        );

        context.transactionMock.staff.findUnique.mockResolvedValue({
            ...SCHEDULING_TEST_FIXTURES.veterinarian,
            idStaff: newVeterinarianId,
        });

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

    describe('changeVeterinarian', () => {
        it('should change the appointment veterinarian successfully', async () => {
            const result = await service.changeVeterinarian(
                appointmentId,
                changedByUserId,
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
                    veterinarianId:
                        SCHEDULING_TEST_IDS.veterinarian,
                    status: AppointmentStatus.PENDING,
                }),
                data: {
                    veterinarianId: newVeterinarianId,
                },
            });
        });

        it('should reject an appointment that does not exist', async () => {
            context.transactionMock.appointment.findUnique.mockResolvedValue(
                null,
            );

            await expect(
                service.changeVeterinarian(
                    appointmentId,
                    changedByUserId,
                    validDto,
                ),
            ).rejects.toThrow('Appointment not found');

            expect(
                context.transactionMock.appointment.updateMany,
            ).not.toHaveBeenCalled();
        });

        it('should reject an appointment that cannot change veterinarian', async () => {
            context.transactionMock.appointment.findUnique.mockResolvedValue({
                ...SCHEDULING_TEST_FIXTURES.appointment,
                status: AppointmentStatus.COMPLETED,
            });

            await expect(
                service.changeVeterinarian(
                    appointmentId,
                    changedByUserId,
                    validDto,
                ),
            ).rejects.toThrow(
                'Only pending or confirmed appointments can change veterinarian',
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
                service.changeVeterinarian(
                    appointmentId,
                    changedByUserId,
                    validDto,
                ),
            ).rejects.toThrow('Appointment request has expired');

            expect(
                context.transactionMock.branch.findUnique,
            ).not.toHaveBeenCalled();
        });

        it('should reject a veterinarian change after the appointment starts', async () => {
            context.transactionMock.appointment.findUnique.mockResolvedValue({
                ...SCHEDULING_TEST_FIXTURES.appointment,
                startsAt: SCHEDULING_TEST_DATES.now,
            });

            await expect(
                service.changeVeterinarian(
                    appointmentId,
                    changedByUserId,
                    validDto,
                ),
            ).rejects.toThrow(
                'Veterinarian cannot be changed after the appointment start time',
            );

            expect(
                context.transactionMock.branch.findUnique,
            ).not.toHaveBeenCalled();
        });

        it('should reject selecting the current veterinarian', async () => {
            const dto = {
                veterinarianId: SCHEDULING_TEST_IDS.veterinarian,
            };

            await expect(
                service.changeVeterinarian(
                    appointmentId,
                    changedByUserId,
                    dto,
                ),
            ).rejects.toThrow(
                'The selected veterinarian is already assigned to this appointment',
            );

            expect(
                context.transactionMock.staff.findUnique,
            ).not.toHaveBeenCalled();
        });

        it('should reject an unavailable appointment branch', async () => {
            context.transactionMock.branch.findUnique.mockResolvedValue({
                ...SCHEDULING_TEST_FIXTURES.branch,
                isActive: false,
            });

            await expect(
                service.changeVeterinarian(
                    appointmentId,
                    changedByUserId,
                    validDto,
                ),
            ).rejects.toThrow('Appointment branch is unavailable');

            expect(
                context.transactionMock.staff.findUnique,
            ).not.toHaveBeenCalled();
        });

        it('should reject a branch with an invalid timezone', async () => {
            context.transactionMock.branch.findUnique.mockResolvedValue({
                ...SCHEDULING_TEST_FIXTURES.branch,
                timeZone: 'Invalid/Timezone',
            });

            await expect(
                service.changeVeterinarian(
                    appointmentId,
                    changedByUserId,
                    validDto,
                ),
            ).rejects.toThrow(
                'Branch has an invalid time zone configuration',
            );

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
                service.changeVeterinarian(
                    appointmentId,
                    changedByUserId,
                    validDto,
                ),
            ).rejects.toThrow(
                'Selected veterinarian is unavailable',
            );

            expect(
                context.transactionMock.staffBranch.findFirst,
            ).not.toHaveBeenCalled();
        });

        it('should reject a staff member who is not a veterinarian', async () => {
            context.transactionMock.staff.findUnique.mockResolvedValue({
                ...SCHEDULING_TEST_FIXTURES.veterinarian,
                position: 'ASSISTANT',
            });

            await expect(
                service.changeVeterinarian(
                    appointmentId,
                    changedByUserId,
                    validDto,
                ),
            ).rejects.toThrow(
                'Selected veterinarian is unavailable',
            );

            expect(
                context.transactionMock.staffBranch.findFirst,
            ).not.toHaveBeenCalled();
        });

        it('should reject a veterinarian not assigned to the appointment branch', async () => {
            context.transactionMock.staffBranch.findFirst.mockResolvedValue(
                null,
            );

            await expect(
                service.changeVeterinarian(
                    appointmentId,
                    changedByUserId,
                    validDto,
                ),
            ).rejects.toThrow(
                'Veterinarian is not assigned to this branch at the appointment time',
            );

            expect(
                context.transactionMock.staffSchedule.findMany,
            ).not.toHaveBeenCalled();
        });

        it('should reject an appointment without a valid end time', async () => {
            context.transactionMock.appointment.findUnique.mockResolvedValue({
                ...SCHEDULING_TEST_FIXTURES.appointment,
                endsAt: null,
            });

            await expect(
                service.changeVeterinarian(
                    appointmentId,
                    changedByUserId,
                    validDto,
                ),
            ).rejects.toThrow(
                'Appointment does not have a valid end time',
            );
        });

        it('should reject a veterinarian schedule that does not cover the appointment', async () => {
            context.transactionMock.staffSchedule.findMany.mockResolvedValue([
                {
                    startsAt: '08:00',
                    endsAt: '10:00',
                },
            ]);

            await expect(
                service.changeVeterinarian(
                    appointmentId,
                    changedByUserId,
                    validDto,
                ),
            ).rejects.toThrow(
                'The veterinarian schedule does not cover this appointment',
            );
        });

        it('should reject an appointment that is not aligned with the veterinarian schedule', async () => {
            context.transactionMock.appointment.findUnique.mockResolvedValue({
                ...SCHEDULING_TEST_FIXTURES.appointment,
                startsAt: new Date('2035-05-14T14:10:00.000Z'),
                endsAt: new Date('2035-05-14T14:30:00.000Z'),
            });

            await expect(
                service.changeVeterinarian(
                    appointmentId,
                    changedByUserId,
                    validDto,
                ),
            ).rejects.toThrow(
                'The veterinarian schedule does not cover this appointment',
            );

            expect(
                context.transactionMock.appointment.updateMany,
            ).not.toHaveBeenCalled();
        });

        it('should expire pending appointments for the new veterinarian', async () => {
            await service.changeVeterinarian(
                appointmentId,
                changedByUserId,
                validDto,
            );

            expect(
                context.expirationServiceMock.expirePendingAppointments,
            ).toHaveBeenCalledWith(
                context.transactionMock,
                newVeterinarianId,
                SCHEDULING_TEST_DATES.now,
            );
        });

        it('should reject a veterinarian who has another appointment at that time', async () => {
            context.transactionMock.appointment.findFirst.mockResolvedValue({
                idAppointment:
                    '12345678-1234-4234-8234-123456789abc',
            });

            await expect(
                service.changeVeterinarian(
                    appointmentId,
                    changedByUserId,
                    validDto,
                ),
            ).rejects.toThrow(
                'The veterinarian already has another appointment at that time',
            );

            expect(
                context.transactionMock.appointment.updateMany,
            ).not.toHaveBeenCalled();
        });

        it('should reject a veterinarian who has a blocked period at that time', async () => {
            context.transactionMock.appointmentBlock.findFirst.mockResolvedValue(
                {
                    idAppointmentBlock:
                        '12345678-1234-4234-8234-123456789abc',
                },
            );

            await expect(
                service.changeVeterinarian(
                    appointmentId,
                    changedByUserId,
                    validDto,
                ),
            ).rejects.toThrow(
                'The veterinarian has a blocked period at that time',
            );

            expect(
                context.transactionMock.appointment.updateMany,
            ).not.toHaveBeenCalled();
        });

        it('should reject reassignment when the appointment changes concurrently', async () => {
            context.transactionMock.appointment.updateMany.mockResolvedValue({
                count: 0,
            });

            await expect(
                service.changeVeterinarian(
                    appointmentId,
                    changedByUserId,
                    validDto,
                ),
            ).rejects.toThrow(
                'Appointment changed before veterinarian reassignment could be completed',
            );

            expect(
                context.transactionMock.appointmentHistory.create,
            ).not.toHaveBeenCalled();
        });

        it('should create a veterinarian change history record', async () => {
            await service.changeVeterinarian(
                appointmentId,
                changedByUserId,
                validDto,
            );

            expect(
                context.transactionMock.appointmentHistory.create,
            ).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    appointmentId,
                    action: AppointmentHistoryAction.VETERINARIAN_CHANGED,
                    performedByUserId: changedByUserId,
                    reason: 'Appointment veterinarian reassigned',
                    previousData: expect.anything(),
                    newData: expect.anything(),
                }),
            });
        });

        it('should propagate errors when updating the appointment', async () => {
            const databaseError = new Error(
                'Veterinarian reassignment failed',
            );

            context.transactionMock.appointment.updateMany.mockRejectedValueOnce(
                databaseError,
            );

            await expect(
                service.changeVeterinarian(
                    appointmentId,
                    changedByUserId,
                    validDto,
                ),
            ).rejects.toThrow(databaseError);

            expect(
                context.transactionMock.appointmentHistory.create,
            ).not.toHaveBeenCalled();
        });

        it('should propagate errors when creating appointment history', async () => {
            const databaseError = new Error(
                'History creation failed',
            );

            context.transactionMock.appointmentHistory.create.mockRejectedValueOnce(
                databaseError,
            );

            await expect(
                service.changeVeterinarian(
                    appointmentId,
                    changedByUserId,
                    validDto,
                ),
            ).rejects.toThrow(databaseError);
        });
    });
});