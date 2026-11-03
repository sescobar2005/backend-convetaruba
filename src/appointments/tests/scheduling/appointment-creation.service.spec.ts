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

import { CreateAppointmentDto } from '../../dto/create-appointment.dto.js';

import {
    SCHEDULING_TEST_DATES,
    SCHEDULING_TEST_FIXTURES,
    SCHEDULING_TEST_IDS,
    createSchedulingTestContext,
} from './scheduling-test.utils.js';
import { AppointmentCreationService } from '../../services/scheduling/appointment-creation.service.js';

describe('AppointmentCreationService', () => {
    let context: ReturnType<typeof createSchedulingTestContext>;
    let service: AppointmentCreationService;

    const customerId = SCHEDULING_TEST_IDS.customer;
    const createdByUserId = SCHEDULING_TEST_IDS.customer;

    const validDto: CreateAppointmentDto = {
        petId: SCHEDULING_TEST_IDS.pet,
        branchId: SCHEDULING_TEST_IDS.branch,
        branchServiceId: SCHEDULING_TEST_IDS.branchService,
        veterinarianId: SCHEDULING_TEST_IDS.veterinarian,
        startsAt: '2035-05-14T14:00:00.000Z',
        notes: '  First appointment  ',
    };

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(SCHEDULING_TEST_DATES.now);

        context = createSchedulingTestContext();

        service = new AppointmentCreationService(
            context.prismaMock,
            context.expirationServiceMock as never,
        );

        context.transactionMock.user.findUnique.mockResolvedValue(
            SCHEDULING_TEST_FIXTURES.customer,
        );

        context.transactionMock.pet.findFirst.mockResolvedValue(
            SCHEDULING_TEST_FIXTURES.pet,
        );

        context.transactionMock.branch.findUnique.mockResolvedValue(
            SCHEDULING_TEST_FIXTURES.branch,
        );

        context.transactionMock.staff.findUnique.mockResolvedValue(
            SCHEDULING_TEST_FIXTURES.veterinarian,
        );

        context.transactionMock.branchService.findUnique.mockResolvedValue(
            SCHEDULING_TEST_FIXTURES.branchService,
        );

        context.transactionMock.branchServicePrice.findFirst.mockResolvedValue(
            SCHEDULING_TEST_FIXTURES.currentPrice,
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

        context.transactionMock.appointment.create.mockResolvedValue(
            SCHEDULING_TEST_FIXTURES.appointment,
        );

        context.transactionMock.appointmentHistory.create.mockResolvedValue(
            {},
        );
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('createAppointment', () => {
        it('should create a pending appointment successfully', async () => {
            const result = await service.createAppointment(
                customerId,
                createdByUserId,
                validDto,
            );

            expect(result).toEqual(
                SCHEDULING_TEST_FIXTURES.appointment,
            );

            expect(
                context.transactionMock.appointment.create,
            ).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    customerId,
                    createdByUserId,
                    petId: validDto.petId,
                    branchId: validDto.branchId,
                    branchServiceId: validDto.branchServiceId,
                    veterinarianId: validDto.veterinarianId,
                    startsAt: new Date(validDto.startsAt),
                    endsAt: new Date('2035-05-14T14:20:00.000Z'),
                    status: AppointmentStatus.PENDING,
                    priceAtBooking: 75000,
                    confirmationExpiresAt: new Date(
                        '2035-05-14T12:15:00.000Z',
                    ),
                    notes: 'First appointment',
                }),
            });
        });

        it('should create an appointment history record', async () => {
            await service.createAppointment(
                customerId,
                createdByUserId,
                validDto,
            );

            expect(
                context.transactionMock.appointmentHistory.create,
            ).toHaveBeenCalledWith({
                data: {
                    appointmentId:
                        SCHEDULING_TEST_IDS.appointment,
                    action: AppointmentHistoryAction.CREATED,
                    reason: 'Appointment request created',
                },
            });
        });

        it('should expire pending appointments before checking availability', async () => {
            await service.createAppointment(
                customerId,
                createdByUserId,
                validDto,
            );

            expect(
                context.expirationServiceMock.expirePendingAppointments,
            ).toHaveBeenCalledWith(
                context.transactionMock,
                SCHEDULING_TEST_IDS.veterinarian,
                SCHEDULING_TEST_DATES.now,
            );
        });

        it('should calculate the provisional appointment end time', async () => {
            await service.createAppointment(
                customerId,
                createdByUserId,
                validDto,
            );

            expect(
                context.transactionMock.appointment.create,
            ).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    endsAt: new Date('2035-05-14T14:20:00.000Z'),
                }),
            });
        });

        it('should calculate the confirmation expiration time', async () => {
            await service.createAppointment(
                customerId,
                createdByUserId,
                validDto,
            );

            expect(
                context.transactionMock.appointment.create,
            ).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    confirmationExpiresAt: new Date(
                        '2035-05-14T12:15:00.000Z',
                    ),
                }),
            });
        });

        it('should store null when appointment notes are not provided', async () => {
            const dto = {
                ...validDto,
                notes: undefined,
            };

            await service.createAppointment(
                customerId,
                createdByUserId,
                dto,
            );

            expect(
                context.transactionMock.appointment.create,
            ).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    notes: null,
                }),
            });
        });

        it('should store null when appointment notes are empty', async () => {
            const dto = {
                ...validDto,
                notes: '   ',
            };

            await service.createAppointment(
                customerId,
                createdByUserId,
                dto,
            );

            expect(
                context.transactionMock.appointment.create,
            ).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    notes: null,
                }),
            });
        });

        it('should reject an invalid appointment start date', async () => {
            const dto = {
                ...validDto,
                startsAt: 'invalid-date',
            };

            await expect(
                service.createAppointment(
                    customerId,
                    createdByUserId,
                    dto,
                ),
            ).rejects.toThrow('Invalid appointment start date');

            expect(
                context.transactionMock.user.findUnique,
            ).not.toHaveBeenCalled();
        });

        it('should reject an appointment start date without a timezone', async () => {
            const dto = {
                ...validDto,
                startsAt: '2035-05-14T14:00:00',
            };

            await expect(
                service.createAppointment(
                    customerId,
                    createdByUserId,
                    dto,
                ),
            ).rejects.toThrow(
                'Appointment start time must include a timezone',
            );

            expect(
                context.transactionMock.user.findUnique,
            ).not.toHaveBeenCalled();
        });

        it('should reject an appointment scheduled in the past', async () => {
            const dto = {
                ...validDto,
                startsAt: '2035-05-14T11:00:00.000Z',
            };

            await expect(
                service.createAppointment(
                    customerId,
                    createdByUserId,
                    dto,
                ),
            ).rejects.toThrow(
                'Appointment start time must be in the future',
            );

            expect(
                context.transactionMock.user.findUnique,
            ).not.toHaveBeenCalled();
        });

        it('should reject a customer that does not exist', async () => {
            context.transactionMock.user.findUnique.mockResolvedValue(null);

            await expect(
                service.createAppointment(
                    customerId,
                    createdByUserId,
                    validDto,
                ),
            ).rejects.toThrow('Customer not found');

            expect(
                context.transactionMock.pet.findFirst,
            ).not.toHaveBeenCalled();
        });

        it('should reject a user who is not a customer', async () => {
            context.transactionMock.user.findUnique.mockResolvedValue({
                ...SCHEDULING_TEST_FIXTURES.customer,
                role: 'STAFF',
            });

            await expect(
                service.createAppointment(
                    customerId,
                    createdByUserId,
                    validDto,
                ),
            ).rejects.toThrow('Customer not found');

            expect(
                context.transactionMock.pet.findFirst,
            ).not.toHaveBeenCalled();
        });

        it('should reject a pet that does not belong to the customer', async () => {
            context.transactionMock.pet.findFirst.mockResolvedValue(null);

            await expect(
                service.createAppointment(
                    customerId,
                    createdByUserId,
                    validDto,
                ),
            ).rejects.toThrow(
                'Active pet not found for this customer',
            );

            expect(
                context.transactionMock.branch.findUnique,
            ).not.toHaveBeenCalled();
        });

        it('should reject an inactive branch', async () => {
            context.transactionMock.branch.findUnique.mockResolvedValue({
                ...SCHEDULING_TEST_FIXTURES.branch,
                isActive: false,
            });

            await expect(
                service.createAppointment(
                    customerId,
                    createdByUserId,
                    validDto,
                ),
            ).rejects.toThrow('Active branch not found');

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
                service.createAppointment(
                    customerId,
                    createdByUserId,
                    validDto,
                ),
            ).rejects.toThrow(
                'Branch has an invalid time zone configuration',
            );

            expect(
                context.transactionMock.staff.findUnique,
            ).not.toHaveBeenCalled();
        });

        it('should reject an inactive veterinarian', async () => {
            context.transactionMock.staff.findUnique.mockResolvedValue({
                ...SCHEDULING_TEST_FIXTURES.veterinarian,
                isActive: false,
            });

            await expect(
                service.createAppointment(
                    customerId,
                    createdByUserId,
                    validDto,
                ),
            ).rejects.toThrow('Active veterinarian not found');

            expect(
                context.transactionMock.branchService.findUnique,
            ).not.toHaveBeenCalled();
        });

        it('should reject a staff member who is not a veterinarian', async () => {
            context.transactionMock.staff.findUnique.mockResolvedValue({
                ...SCHEDULING_TEST_FIXTURES.veterinarian,
                position: 'ASSISTANT',
            });

            await expect(
                service.createAppointment(
                    customerId,
                    createdByUserId,
                    validDto,
                ),
            ).rejects.toThrow('Active veterinarian not found');
        });

        it('should reject a service that does not exist in the selected branch', async () => {
            context.transactionMock.branchService.findUnique.mockResolvedValue(
                null,
            );

            await expect(
                service.createAppointment(
                    customerId,
                    createdByUserId,
                    validDto,
                ),
            ).rejects.toThrow(
                'Active service not found in this branch',
            );

            expect(
                context.transactionMock.branchServicePrice.findFirst,
            ).not.toHaveBeenCalled();
        });

        it('should reject a service that is not published', async () => {
            context.transactionMock.branchService.findUnique.mockResolvedValue({
                ...SCHEDULING_TEST_FIXTURES.branchService,
                service: {
                    isActive: true,
                    isPublished: false,
                },
            });

            await expect(
                service.createAppointment(
                    customerId,
                    createdByUserId,
                    validDto,
                ),
            ).rejects.toThrow(
                'The service is not available for appointments',
            );

            expect(
                context.transactionMock.branchServicePrice.findFirst,
            ).not.toHaveBeenCalled();
        });

        it('should reject a service without a current price', async () => {
            context.transactionMock.branchServicePrice.findFirst.mockResolvedValue(
                null,
            );

            await expect(
                service.createAppointment(
                    customerId,
                    createdByUserId,
                    validDto,
                ),
            ).rejects.toThrow(
                'The service does not have a current price',
            );

            expect(
                context.transactionMock.staffBranch.findFirst,
            ).not.toHaveBeenCalled();
        });

        it('should reject a veterinarian who is not assigned to the branch', async () => {
            context.transactionMock.staffBranch.findFirst.mockResolvedValue(
                null,
            );

            await expect(
                service.createAppointment(
                    customerId,
                    createdByUserId,
                    validDto,
                ),
            ).rejects.toThrow(
                'Veterinarian is not assigned to this branch at the requested time',
            );

            expect(
                context.transactionMock.staffSchedule.findMany,
            ).not.toHaveBeenCalled();
        });

        it('should reject a requested time outside the veterinarian schedule', async () => {
            context.transactionMock.staffSchedule.findMany.mockResolvedValue([
                {
                    startsAt: '08:00',
                    endsAt: '09:00',
                },
            ]);

            await expect(
                service.createAppointment(
                    customerId,
                    createdByUserId,
                    validDto,
                ),
            ).rejects.toThrow(
                'Requested time is not an available appointment slot',
            );

            expect(
                context.transactionMock.appointment.create,
            ).not.toHaveBeenCalled();
        });

        it('should reject an appointment that conflicts with another appointment', async () => {
            context.transactionMock.appointment.findFirst.mockResolvedValue({
                idAppointment: '12345678-1234-4234-8234-123456789abc',
            });

            await expect(
                service.createAppointment(
                    customerId,
                    createdByUserId,
                    validDto,
                ),
            ).rejects.toThrow(
                'Veterinarian already has an appointment at this time',
            );

            expect(
                context.transactionMock.appointment.create,
            ).not.toHaveBeenCalled();

            expect(
                context.transactionMock.appointmentBlock.findFirst,
            ).toHaveBeenCalled();
        });

        it('should reject an appointment that conflicts with a scheduled block', async () => {
            context.transactionMock.appointmentBlock.findFirst.mockResolvedValue({
                idAppointmentBlock: '12345678-1234-4234-8234-123456789abc',
            });

            await expect(
                service.createAppointment(
                    customerId,
                    createdByUserId,
                    validDto,
                ),
            ).rejects.toThrow(
                'Veterinarian is unavailable due to a scheduled block',
            );

            expect(
                context.transactionMock.appointment.create,
            ).not.toHaveBeenCalled();
        });

        it('should not create an appointment when expiration processing fails', async () => {
            const databaseError = new Error(
                'Expiration processing failed',
            );

            context.expirationServiceMock.expirePendingAppointments.mockRejectedValueOnce(
                databaseError,
            );

            await expect(
                service.createAppointment(
                    customerId,
                    createdByUserId,
                    validDto,
                ),
            ).rejects.toThrow(databaseError);

            expect(
                context.transactionMock.appointment.findFirst,
            ).not.toHaveBeenCalled();

            expect(
                context.transactionMock.appointment.create,
            ).not.toHaveBeenCalled();
        });

        it('should propagate database errors when creating an appointment', async () => {
            const databaseError = new Error(
                'Appointment creation failed',
            );

            context.transactionMock.appointment.create.mockRejectedValueOnce(
                databaseError,
            );

            await expect(
                service.createAppointment(
                    customerId,
                    createdByUserId,
                    validDto,
                ),
            ).rejects.toThrow(databaseError);

            expect(
                context.transactionMock.appointmentHistory.create,
            ).not.toHaveBeenCalled();
        });

        it('should propagate database errors when creating appointment history', async () => {
            const databaseError = new Error(
                'History creation failed',
            );

            context.transactionMock.appointmentHistory.create.mockRejectedValueOnce(
                databaseError,
            );

            await expect(
                service.createAppointment(
                    customerId,
                    createdByUserId,
                    validDto,
                ),
            ).rejects.toThrow(databaseError);
        });
    });
});