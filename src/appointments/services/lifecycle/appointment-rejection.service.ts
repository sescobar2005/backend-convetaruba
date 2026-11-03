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
import { RejectAppointmentDto } from '../../dto/reject-appointment.dto.js';

@Injectable()
export class AppointmentRejectionService {
    constructor(
        private readonly prisma: PrismaService,
    ) {}

    async rejectAppointment(
        appointmentId: string,
        rejectedByUserId: string,
        dto: RejectAppointmentDto,
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

            if (appointment.status !== AppointmentStatus.PENDING) {
                throw new BadRequestException(
                    'Only pending appointments can be rejected',
                );
            }

            const now = new Date();

            if (appointment.confirmationExpiresAt <= now) {
                await transaction.appointment.updateMany({
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

                await transaction.appointmentHistory.create({
                    data: {
                        appointmentId,
                        performedByUserId: rejectedByUserId,
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

            const result = await transaction.appointment.updateMany({
                where: {
                    idAppointment: appointmentId,
                    status: AppointmentStatus.PENDING,
                    confirmationExpiresAt: {
                        gt: now,
                    },
                },
                data: {
                    status: AppointmentStatus.REJECTED,
                },
            });

            if (result.count !== 1) {
                throw new BadRequestException(
                    'Appointment is no longer pending or has expired',
                );
            }

            await transaction.appointmentHistory.create({
                data: {
                    appointmentId,
                    performedByUserId: rejectedByUserId,
                    action: AppointmentHistoryAction.REJECTED,
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