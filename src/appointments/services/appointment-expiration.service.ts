import { Injectable } from '@nestjs/common';
import {
    AppointmentHistoryAction,
    AppointmentStatus,
} from '../../../generated/prisma/enums.js';
import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class AppointmentExpirationService {
    constructor(
        private readonly prisma: PrismaService,
    ) {}

    async expireAppointments() {
        const now = new Date();

        return this.prisma.client.$transaction(async (transaction) => {
            const expiredAppointments =
                await transaction.appointment.findMany({
                    where: {
                        status: AppointmentStatus.PENDING,
                        confirmationExpiresAt: {
                            lte: now,
                        },
                    },
                    select: {
                        idAppointment: true,
                    },
                });

            let expiredCount = 0;

            for (const appointment of expiredAppointments) {
                const result = await transaction.appointment.updateMany({
                    where: {
                        idAppointment: appointment.idAppointment,
                        status: AppointmentStatus.PENDING,
                        confirmationExpiresAt: {
                            lte: now,
                        },
                    },
                    data: {
                        status: AppointmentStatus.EXPIRED,
                    },
                });

                if (result.count !== 1) {
                    continue;
                }

                await transaction.appointmentHistory.create({
                    data: {
                        appointmentId: appointment.idAppointment,
                        action: AppointmentHistoryAction.EXPIRED,
                        reason:
                            'Appointment request expired after 15 minutes without confirmation',
                    },
                });

                expiredCount++;
            }

            return { expiredCount };
        });
    }

    async expirePendingAppointments(
        transaction: Prisma.TransactionClient,
        veterinarianId: string,
        now: Date,
    ): Promise<void> {
        const expiredAppointments =
            await transaction.appointment.findMany({
                where: {
                    veterinarianId,
                    status: AppointmentStatus.PENDING,
                    confirmationExpiresAt: {
                        lte: now,
                    },
                },
                select: {
                    idAppointment: true,
                },
            });

        for (const appointment of expiredAppointments) {
            const result = await transaction.appointment.updateMany({
                where: {
                    idAppointment: appointment.idAppointment,
                    status: AppointmentStatus.PENDING,
                    confirmationExpiresAt: {
                        lte: now,
                    },
                },
                data: {
                    status: AppointmentStatus.EXPIRED,
                },
            });

            if (result.count === 1) {
                await transaction.appointmentHistory.create({
                    data: {
                        appointmentId: appointment.idAppointment,
                        action: AppointmentHistoryAction.EXPIRED,
                        reason:
                            'Appointment request expired after 15 minutes without confirmation',
                    },
                });
            }
        }
    }
}