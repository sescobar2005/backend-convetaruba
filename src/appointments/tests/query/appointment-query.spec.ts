import { NotFoundException, BadRequestException } from '@nestjs/common';
import {
    beforeEach,
    describe,
    expect,
    it,
} from 'vitest';

import { AppointmentQueryService } from '../../services/appointment-query.service.js';
import {
    QUERY_TEST_DATE,
    QUERY_TEST_FIXTURES,
    QUERY_TEST_IDS,
    createQueryTestContext,
} from './query-test.utils.js';

describe('AppointmentQueryService', () => {
    let context: ReturnType<typeof createQueryTestContext>;
    let service: AppointmentQueryService;

    beforeEach(() => {
        context = createQueryTestContext();

        service = new AppointmentQueryService(
            context.prismaServiceMock,
        );

        context.prismaMock.client.appointment.findUnique.mockResolvedValue(
            QUERY_TEST_FIXTURES.appointment,
        );

        context.prismaMock.client.appointment.findMany.mockResolvedValue(
            QUERY_TEST_FIXTURES.appointments,
        );

        context.prismaMock.client.branch.findUnique.mockResolvedValue(
            QUERY_TEST_FIXTURES.branch,
        );
    });

    describe('getAppointmentById', () => {
        it('should return an appointment for its customer', async () => {
            const result = await service.getAppointmentById(
                QUERY_TEST_IDS.appointment,
                QUERY_TEST_IDS.customer,
                false,
            );

            expect(result).toEqual(QUERY_TEST_FIXTURES.appointment);

            expect(
                context.prismaMock.client.appointment.findUnique,
            ).toHaveBeenCalledWith({
                where: {
                    idAppointment: QUERY_TEST_IDS.appointment,
                },
                include: {
                    pet: true,
                    branch: true,
                    branchService: {
                        include: {
                            service: true,
                        },
                    },
                    veterinarian: {
                        include: {
                            user: {
                                select: {
                                    idUser: true,
                                    firstName: true,
                                    lastName: true,
                                },
                            },
                        },
                    },
                    customer: {
                        select: {
                            idUser: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            mobileNumber: true,
                        },
                    },
                },
            });
        });

        it('should allow staff to access any appointment', async () => {
            const result = await service.getAppointmentById(
                QUERY_TEST_IDS.appointment,
                QUERY_TEST_IDS.anotherCustomer,
                true,
            );

            expect(result).toEqual(QUERY_TEST_FIXTURES.appointment);
        });

        it('should throw when the appointment does not exist', async () => {
            context.prismaMock.client.appointment.findUnique.mockResolvedValue(
                null,
            );

            await expect(
                service.getAppointmentById(
                    QUERY_TEST_IDS.appointment,
                    QUERY_TEST_IDS.customer,
                    false,
                ),
            ).rejects.toThrow(
                new NotFoundException('Appointment not found'),
            );
        });

        it('should throw when the customer does not own the appointment', async () => {
            await expect(
                service.getAppointmentById(
                    QUERY_TEST_IDS.appointment,
                    QUERY_TEST_IDS.anotherCustomer,
                    false,
                ),
            ).rejects.toThrow(
                new NotFoundException('Appointment not found'),
            );
        });
    });

    describe('getCustomerAppointments', () => {
        it('should return appointments belonging to the customer', async () => {
            const result = await service.getCustomerAppointments(
                QUERY_TEST_IDS.customer,
                QUERY_TEST_IDS.customer,
                false,
            );

            expect(result).toEqual(QUERY_TEST_FIXTURES.appointments);

            expect(
                context.prismaMock.client.appointment.findMany,
            ).toHaveBeenCalledWith({
                where: {
                    customerId: QUERY_TEST_IDS.customer,
                },
                include: {
                    pet: true,
                    branch: true,
                    branchService: true,
                    veterinarian: true,
                },
                orderBy: {
                    startsAt: 'desc',
                },
            });
        });

        it('should allow staff to access another customer appointments', async () => {
            await service.getCustomerAppointments(
                QUERY_TEST_IDS.customer,
                QUERY_TEST_IDS.anotherCustomer,
                true,
            );

            expect(
                context.prismaMock.client.appointment.findMany,
            ).toHaveBeenCalledOnce();
        });

        it('should throw when a customer requests another customer appointments', async () => {
            await expect(
                service.getCustomerAppointments(
                    QUERY_TEST_IDS.customer,
                    QUERY_TEST_IDS.anotherCustomer,
                    false,
                ),
            ).rejects.toThrow(
                new NotFoundException('Customer not found'),
            );

            expect(
                context.prismaMock.client.appointment.findMany,
            ).not.toHaveBeenCalled();
        });
    });

    describe('getBranchAppointments', () => {
        it('should return appointments belonging to the branch', async () => {
            const result = await service.getBranchAppointments(
                QUERY_TEST_IDS.branch,
                {},
            );

            expect(result).toEqual(QUERY_TEST_FIXTURES.appointments);

            expect(
                context.prismaMock.client.appointment.findMany,
            ).toHaveBeenCalledWith({
                where: {
                    branchId: QUERY_TEST_IDS.branch,
                },
                include: {
                    customer: {
                        select: {
                            idUser: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            mobileNumber: true,
                        },
                    },
                    pet: true,
                    branchService: true,
                    veterinarian: {
                        include: {
                            user: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    startsAt: 'asc',
                },
            });
        });

        it('should throw when the branch does not exist', async () => {
            context.prismaMock.client.branch.findUnique.mockResolvedValue(
                null,
            );

            await expect(
                service.getBranchAppointments(
                    QUERY_TEST_IDS.branch,
                    {},
                ),
            ).rejects.toThrow(
                new NotFoundException('Branch not found'),
            );
        });

        it('should filter appointments by status', async () => {
            await service.getBranchAppointments(
                QUERY_TEST_IDS.branch,
                {
                    status: 'CONFIRMED',
                } as never,
            );

            expect(
                context.prismaMock.client.appointment.findMany,
            ).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        branchId: QUERY_TEST_IDS.branch,
                        status: 'CONFIRMED',
                    },
                }),
            );
        });

        it('should filter appointments by the branch local date', async () => {
            await service.getBranchAppointments(
                QUERY_TEST_IDS.branch,
                {
                    date: QUERY_TEST_DATE,
                } as never,
            );

            expect(
                context.prismaMock.client.appointment.findMany,
            ).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        branchId: QUERY_TEST_IDS.branch,
                        startsAt: {
                            gte: new Date('2030-05-06T04:00:00.000Z'),
                            lt: new Date('2030-05-07T04:00:00.000Z'),
                        },
                    },
                }),
            );
        });

        it('should throw when the date filter is invalid', async () => {
            await expect(
                service.getBranchAppointments(
                    QUERY_TEST_IDS.branch,
                    {
                        date: 'invalid-date',
                    } as never,
                ),
            ).rejects.toThrow(BadRequestException);
        });
    });
});