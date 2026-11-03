import {
    BadRequestException,
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import {
    AppointmentHistoryAction,
    AppointmentStatus,
} from '../../../../generated/prisma/enums.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CompleteAppointmentDto } from '../../dto/complete-appointment.dto.js';

@Injectable()
export class AppointmentCompletionService {
    constructor(
        private readonly prisma: PrismaService,
    ) {}

    async completeAppointment(
        appointmentId: string,
        completedByUserId: string,
        dto: CompleteAppointmentDto,
    ) {
        return this.prisma.client.$transaction(async (transaction) => {
            const appointment = await transaction.appointment.findUnique({
                where: {
                    idAppointment: appointmentId,
                },
                include: {
                    veterinarian: {
                        select: {
                            userId: true,
                        },
                    },
                },
            });

            if (!appointment) {
                throw new NotFoundException('Appointment not found');
            }

            if (appointment.veterinarian.userId !== completedByUserId) {
                throw new ForbiddenException(
                    'Only the assigned veterinarian can complete this appointment',
                );
            }

            if (appointment.status !== AppointmentStatus.IN_PROGRESS) {
                throw new BadRequestException(
                    'Only appointments in progress can be completed',
                );
            }

            const now = new Date();

            const result = await transaction.appointment.updateMany({
                where: {
                    idAppointment: appointmentId,
                    veterinarianId: appointment.veterinarianId,
                    status: AppointmentStatus.IN_PROGRESS,
                },
                data: {
                    status: AppointmentStatus.COMPLETED,
                    completedAt: now,
                },
            });

            if (result.count !== 1) {
                throw new BadRequestException(
                    'Appointment status changed before it could be completed',
                );
            }

            await transaction.medicalRecord.create({
                data: {
                    appointmentId,
                    petId: appointment.petId,
                    veterinarianId: appointment.veterinarianId,
                    observations: dto.observations?.trim(),
                    diagnosis: dto.diagnosis?.trim(),
                    treatment: dto.treatment?.trim(),
                    recommendations: dto.recommendations?.trim(),
                },
            });

            await transaction.appointmentHistory.create({
                data: {
                    appointmentId,
                    performedByUserId: completedByUserId,
                    action: AppointmentHistoryAction.COMPLETED,
                    newData: {
                        status: AppointmentStatus.COMPLETED,
                        completedAt: now.toISOString(),
                    },
                    reason: 'Appointment completed and medical record created',
                },
            });

            return transaction.appointment.findUnique({
                where: {
                    idAppointment: appointmentId,
                },
                include: {
                    pet: true,
                    customer: {
                        select: {
                            idUser: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                    branch: true,
                    branchService: true,
                    veterinarian: true,
                    medicalRecord: true,
                    history: true,
                },
            });
        });
    }

}