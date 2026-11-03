import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { formatInTimeZone } from 'date-fns-tz';
import {
    AppointmentHistoryAction,
    AppointmentStatus,
    StaffPosition,
} from '../../../../generated/prisma/enums.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { ChangeVeterinarianDto } from '../../dto/change-veterinarian.dto.js';
import { AppointmentExpirationService } from '../appointment-expiration.service.js';
import {
    getLocalDayRange,
    validateTimeZone,
} from '../../helpers/appointment-date.helper.js';
import {
    isSlotAligned,
    parseTime,
} from '../../helpers/appointment-time.helper.js';

@Injectable()
export class AppointmentVeterinarianService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly expirationService: AppointmentExpirationService,
    ) {}

    async changeVeterinarian(
        appointmentId: string,
        changedByUserId: string,
        dto: ChangeVeterinarianDto,
    ) {
        const now = new Date();

        return this.prisma.client.$transaction(async (transaction) => {
            const appointment = await transaction.appointment.findUnique({
                where: {
                    idAppointment: appointmentId,
                },
            });

            if (!appointment) {
                throw new NotFoundException('Appointment not found');
            }

            if (
                appointment.status !== AppointmentStatus.PENDING &&
                appointment.status !== AppointmentStatus.CONFIRMED
            ) {
                throw new BadRequestException(
                    'Only pending or confirmed appointments can change veterinarian',
                );
            }

            if (
                appointment.status === AppointmentStatus.PENDING &&
                appointment.confirmationExpiresAt <= now
            ) {
                throw new BadRequestException(
                    'Appointment request has expired',
                );
            }

            if (appointment.startsAt <= now) {
                throw new BadRequestException(
                    'Veterinarian cannot be changed after the appointment start time',
                );
            }

            if (appointment.veterinarianId === dto.veterinarianId) {
                throw new BadRequestException(
                    'The selected veterinarian is already assigned to this appointment',
                );
            }

            const branch = await transaction.branch.findUnique({
                where: {
                    idBranch: appointment.branchId,
                },
                select: {
                    idBranch: true,
                    isActive: true,
                    timeZone: true,
                },
            });

            if (!branch || !branch.isActive) {
                throw new BadRequestException(
                    'Appointment branch is unavailable',
                );
            }

            validateTimeZone(branch.timeZone);

            const veterinarian = await transaction.staff.findUnique({
                where: {
                    idStaff: dto.veterinarianId,
                },
                select: {
                    idStaff: true,
                    isActive: true,
                    position: true,
                },
            });

            if (
                !veterinarian ||
                !veterinarian.isActive ||
                veterinarian.position !== StaffPosition.VETERINARIAN
            ) {
                throw new BadRequestException(
                    'Selected veterinarian is unavailable',
                );
            }

            const localDate = formatInTimeZone(
                appointment.startsAt,
                branch.timeZone,
                'yyyy-MM-dd',
            );

            const {
                dayStartsAt,
                dayEndsAt,
                weekDay,
            } = getLocalDayRange(localDate, branch.timeZone);

            const assignment = await transaction.staffBranch.findFirst({
                where: {
                    staffId: dto.veterinarianId,
                    branchId: appointment.branchId,
                    isActive: true,
                    startDate: {
                        lte: appointment.startsAt,
                    },
                    OR: [
                        {
                            endDate: null,
                        },
                        {
                            endDate: {
                                gt: appointment.startsAt,
                            },
                        },
                    ],
                },
            });

            if (!assignment) {
                throw new BadRequestException(
                    'Veterinarian is not assigned to this branch at the appointment time',
                );
            }

            const schedules = await transaction.staffSchedule.findMany({
                where: {
                    staffId: dto.veterinarianId,
                    branchId: appointment.branchId,
                    weekDay,
                    isActive: true,
                },
            });

            const appointmentEndsAt = appointment.endsAt;

            if (!appointmentEndsAt) {
                throw new BadRequestException(
                    'Appointment does not have a valid end time',
                );
            }

            const startTime = formatInTimeZone(
                appointment.startsAt,
                branch.timeZone,
                'HH:mm',
            );

            const endTime = formatInTimeZone(
                appointmentEndsAt,
                branch.timeZone,
                'HH:mm',
            );

            const startMinutes = parseTime(startTime);
            const endMinutes = parseTime(endTime);

            const scheduleAllowsAppointment = schedules.some((schedule) => {
                const scheduleStart = parseTime(schedule.startsAt);
                const scheduleEnd = parseTime(schedule.endsAt);

                return (
                    startMinutes >= scheduleStart &&
                    endMinutes <= scheduleEnd &&
                    isSlotAligned(startMinutes, scheduleStart)
                );
            });

            if (!scheduleAllowsAppointment) {
                throw new BadRequestException(
                    'The veterinarian schedule does not cover this appointment',
                );
            }

            if (
                appointment.startsAt < dayStartsAt ||
                appointmentEndsAt > dayEndsAt
            ) {
                throw new BadRequestException(
                    'Appointment cannot extend beyond the selected local day',
                );
            }

            await this.expirationService.expirePendingAppointments(
                transaction,
                dto.veterinarianId,
                now,
            );

            const overlappingAppointment =
                await transaction.appointment.findFirst({
                    where: {
                        veterinarianId: dto.veterinarianId,
                        idAppointment: {
                            not: appointmentId,
                        },
                        status: {
                            in: [
                                AppointmentStatus.PENDING,
                                AppointmentStatus.CONFIRMED,
                                AppointmentStatus.IN_PROGRESS,
                            ],
                        },
                        startsAt: {
                            lt: appointmentEndsAt,
                        },
                        endsAt: {
                            gt: appointment.startsAt,
                        },
                    },
                });

            if (overlappingAppointment) {
                throw new BadRequestException(
                    'The veterinarian already has another appointment at that time',
                );
            }

            const overlappingBlock =
                await transaction.appointmentBlock.findFirst({
                    where: {
                        staffId: dto.veterinarianId,
                        startsAt: {
                            lt: appointmentEndsAt,
                        },
                        endsAt: {
                            gt: appointment.startsAt,
                        },
                    },
                });

            if (overlappingBlock) {
                throw new BadRequestException(
                    'The veterinarian has a blocked period at that time',
                );
            }

            const updated = await transaction.appointment.updateMany({
                where: {
                    idAppointment: appointmentId,
                    veterinarianId: appointment.veterinarianId,
                    status: appointment.status,
                    ...(appointment.status === AppointmentStatus.PENDING
                        ? {
                            confirmationExpiresAt: {
                                gt: now,
                            },
                        }
                        : {}),
                },
                data: {
                    veterinarianId: dto.veterinarianId,
                },
            });

            if (updated.count !== 1) {
                throw new BadRequestException(
                    'Appointment changed before veterinarian reassignment could be completed',
                );
            }

            await transaction.appointmentHistory.create({
                data: {
                    appointmentId,
                    performedByUserId: changedByUserId,
                    action: AppointmentHistoryAction.VETERINARIAN_CHANGED,
                    previousData: {
                        veterinarianId: appointment.veterinarianId,
                    },
                    newData: {
                        veterinarianId: dto.veterinarianId,
                    },
                    reason: 'Appointment veterinarian reassigned',
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
                    history: true,
                },
            });
        });
    }

}