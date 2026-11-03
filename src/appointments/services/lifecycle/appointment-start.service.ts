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

@Injectable()
export class AppointmentStartService {
    constructor(
        private readonly prisma: PrismaService,
    ) {}

    async startAppointment(
        appointmentId: string,
        startedByUserId: string,
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

            if (appointment.status !== AppointmentStatus.CONFIRMED) {
                throw new BadRequestException(
                    'Only confirmed appointments can be started',
                );
            }

            const now = new Date();

            if (appointment.startsAt > now) {
                throw new BadRequestException(
                    'Appointment cannot be started before its scheduled time',
                );
            }

            const result = await transaction.appointment.updateMany({
                where: {
                    idAppointment: appointmentId,
                    status: AppointmentStatus.CONFIRMED,
                },
                data: {
                    status: AppointmentStatus.IN_PROGRESS,
                },
            });

            if (result.count !== 1) {
                throw new BadRequestException(
                    'Appointment status changed before it could be started',
                );
            }

            await transaction.appointmentHistory.create({
                data: {
                    appointmentId,
                    performedByUserId: startedByUserId,
                    action: AppointmentHistoryAction.STARTED,
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
                },
            });
        });
    }

}