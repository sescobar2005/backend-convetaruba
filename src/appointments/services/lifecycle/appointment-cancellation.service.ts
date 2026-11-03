import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import {
    AppointmentHistoryAction,
    AppointmentStatus,
} from '../../../../generated/prisma/enums.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CancelAppointmentDto } from '../../dto/cancel-appointment.dto.js';

@Injectable()
export class AppointmentCancellationService {
    constructor(
        private readonly prisma: PrismaService,
    ) {}

    async cancelAppointment(
        appointmentId: string,
        cancelledByUserId: string,
        dto: CancelAppointmentDto,
    ) {
        return this.prisma.client.$transaction(async (transaction) => {
            const appointment = await transaction.appointment.findUnique({
                where: {
                    idAppointment: appointmentId,
                },
            });

            if (!appointment) {
                throw new NotFoundException('Appointment not found');
            }

            const now = new Date();

            if (appointment.status === AppointmentStatus.PENDING) {
                if (appointment.confirmationExpiresAt <= now) {
                    const result = await transaction.appointment.updateMany({
                        where: {
                            idAppointment: appointmentId,
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
                                appointmentId,
                                performedByUserId: cancelledByUserId,
                                action: AppointmentHistoryAction.EXPIRED,
                                reason: 'Appointment request expired after 15 minutes without confirmation',
                            },
                        });

                        return transaction.appointment.findUnique({
                            where: {
                                idAppointment: appointmentId,
                            },
                        });
                    }

                    throw new BadRequestException(
                        'Appointment status changed before cancellation could be processed',
                    );
                }
            }

            if (
                appointment.status !== AppointmentStatus.PENDING &&
                appointment.status !== AppointmentStatus.CONFIRMED
            ) {
                throw new BadRequestException(
                    'Only pending or confirmed appointments can be cancelled',
                );
            }

            const result = await transaction.appointment.updateMany({
                where: {
                    idAppointment: appointmentId,
                    status: {
                        in: [
                            AppointmentStatus.PENDING,
                            AppointmentStatus.CONFIRMED,
                        ],
                    },
                    OR: [
                        {
                            status: AppointmentStatus.CONFIRMED,
                        },
                        {
                            status: AppointmentStatus.PENDING,
                            confirmationExpiresAt: {
                                gt: now,
                            },
                        },
                    ],
                },
                data: {
                    status: AppointmentStatus.CANCELLED,
                    cancelledAt: now,
                    cancellationReason: dto.reason.trim(),
                },
            });

            if (result.count !== 1) {
                throw new BadRequestException(
                    'Appointment is no longer eligible for cancellation',
                );
            }

            await transaction.appointmentHistory.create({
                data: {
                    appointmentId,
                    performedByUserId: cancelledByUserId,
                    action: AppointmentHistoryAction.CANCELLED,
                    reason: dto.reason.trim(),
                },
            });

            return transaction.appointment.findUnique({
                where: {
                    idAppointment: appointmentId,
                },
            });
        });
    }

}