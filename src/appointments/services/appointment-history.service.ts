import {
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class AppointmentHistoryService {
    constructor(
        private readonly prisma: PrismaService,
    ) {}

    async getAppointmentHistory(
        appointmentId: string,
        requestingUserId: string,
        isStaff: boolean,
    ) {
        const appointment = await this.prisma.client.appointment.findUnique({
            where: {
                idAppointment: appointmentId,
            },
            select: {
                idAppointment: true,
                customerId: true,
            },
        });

        if (
            !appointment ||
            (!isStaff && appointment.customerId !== requestingUserId)
        ) {
            throw new NotFoundException('Appointment not found');
        }

        return this.prisma.client.appointmentHistory.findMany({
            where: {
                appointmentId,
            },
            include: {
                performedBy: {
                    select: {
                        idUser: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
        });
    }
}