import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { GetBranchAppointmentsDto } from '../dto/get-branch-appointments.dto.js';
import {
    getLocalDayRange,
    validateDate,
} from '../helpers/appointment-date.helper.js';

@Injectable()
export class AppointmentQueryService {
    constructor(
        private readonly prisma: PrismaService,
    ) {}

    async getAppointmentById(
        appointmentId: string,
        requestingUserId: string,
        isStaff: boolean,
    ) {
        const appointment = await this.prisma.client.appointment.findUnique({
            where: {
                idAppointment: appointmentId,
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

        if (
            !appointment ||
            (!isStaff && appointment.customerId !== requestingUserId)
        ) {
            throw new NotFoundException('Appointment not found');
        }

        return appointment;
    }

    async getCustomerAppointments(
        customerId: string,
        requestingUserId: string,
        isStaff: boolean,
    ) {
        if (!isStaff && customerId !== requestingUserId) {
            throw new NotFoundException('Customer not found');
        }

        return this.prisma.client.appointment.findMany({
            where: {
                customerId,
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
    }

    async getBranchAppointments(
        branchId: string,
        filters: GetBranchAppointmentsDto,
    ) {
        const branch = await this.prisma.client.branch.findUnique({
            where: {
                idBranch: branchId,
            },
            select: {
                idBranch: true,
                timeZone: true,
            },
        });

        if (!branch) {
            throw new NotFoundException('Branch not found');
        }

        const where: Prisma.AppointmentWhereInput = {
            branchId,
            ...(filters.status && {
                status: filters.status,
            }),
        };

        if (filters.date) {
            validateDate(filters.date);

            const { dayStartsAt, dayEndsAt } = getLocalDayRange(
                filters.date,
                branch.timeZone,
            );

            where.startsAt = {
                gte: dayStartsAt,
                lt: dayEndsAt,
            };
        }

        return this.prisma.client.appointment.findMany({
            where,
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
    }

}