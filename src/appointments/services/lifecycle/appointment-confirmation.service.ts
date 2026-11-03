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
import { ConfirmAppointmentDto } from '../../dto/confirm-appointment.dto.js';
import {
    getLocalDayRange,
    validateTimeZone,
} from '../../helpers/appointment-date.helper.js';
import { parseTime } from '../../helpers/appointment-time.helper.js';

@Injectable()
export class AppointmentConfirmationService {
    constructor(
        private readonly prisma: PrismaService,
    ) {}

    async confirmAppointment(
        appointmentId: string,
        confirmedByUserId: string,
        dto: ConfirmAppointmentDto,
    ) {
        const endsAt = new Date(dto.endsAt);

        if (Number.isNaN(endsAt.getTime())) {
            throw new BadRequestException('Invalid appointment end date');
        }

        if (!/(Z|[+-]\d{2}:\d{2})$/i.test(dto.endsAt)) {
            throw new BadRequestException(
                'Appointment end time must include a timezone',
            );
        }

        const now = new Date();

        return this.prisma.client.$transaction(async (transaction) => {
            const appointment = await transaction.appointment.findUnique({
                where: {
                    idAppointment: appointmentId,
                },
                select: {
                    idAppointment: true,
                    veterinarianId: true,
                    branchId: true,
                    startsAt: true,
                    endsAt: true,
                    status: true,
                    confirmationExpiresAt: true,
                    branch: {
                        select: {
                            timeZone: true,
                            isActive: true,
                        },
                    },
                    veterinarian: {
                        select: {
                            idStaff: true,
                            isActive: true,
                            position: true,
                        },
                    },
                },
            });

            if (!appointment) {
                throw new NotFoundException('Appointment not found');
            }

            if (appointment.status !== AppointmentStatus.PENDING) {
                throw new BadRequestException(
                    'Only pending appointments can be confirmed',
                );
            }

            if (appointment.confirmationExpiresAt <= now) {
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
                            reason: 'Appointment request expired after 15 minutes without confirmation',
                        },
                    });
                }

                throw new BadRequestException(
                    'Appointment confirmation period has expired',
                );
            }

            if (endsAt <= appointment.startsAt) {
                throw new BadRequestException(
                    'Appointment end time must be after its start time',
                );
            }

            if (endsAt <= now) {
                throw new BadRequestException(
                    'Appointment end time must be in the future',
                );
            }

            if (
                !appointment.branch.isActive ||
                !appointment.veterinarian.isActive ||
                appointment.veterinarian.position !== StaffPosition.VETERINARIAN
            ) {
                throw new BadRequestException(
                    'Branch or veterinarian is no longer available',
                );
            }

            validateTimeZone(appointment.branch.timeZone);

            const localDate = formatInTimeZone(
                appointment.startsAt,
                appointment.branch.timeZone,
                'yyyy-MM-dd',
            );

            const localStartTime = formatInTimeZone(
                appointment.startsAt,
                appointment.branch.timeZone,
                'HH:mm',
            );

            const localEndTime = formatInTimeZone(
                endsAt,
                appointment.branch.timeZone,
                'HH:mm',
            );

            const {
                dayStartsAt,
                dayEndsAt,
                weekDay,
            } = getLocalDayRange(
                localDate,
                appointment.branch.timeZone,
            );

            if (endsAt > dayEndsAt) {
                throw new BadRequestException(
                    'Appointment cannot extend beyond the branch working day',
                );
            }

            const assignment = await transaction.staffBranch.findFirst({
                where: {
                    staffId: appointment.veterinarianId,
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
                                gte: appointment.startsAt,
                            },
                        },
                    ],
                },
                select: {
                    idStaffBranch: true,
                },
            });

            if (!assignment) {
                throw new BadRequestException(
                    'Veterinarian is no longer assigned to this branch',
                );
            }

            const schedules = await transaction.staffSchedule.findMany({
                where: {
                    staffId: appointment.veterinarianId,
                    branchId: appointment.branchId,
                    weekDay,
                    isActive: true,
                },
                select: {
                    startsAt: true,
                    endsAt: true,
                },
            });

            const startMinute = parseTime(localStartTime);
            const endMinute = parseTime(localEndTime);

            const belongsToSchedule = schedules.some((schedule) => {
                const scheduleStart = parseTime(schedule.startsAt);
                const scheduleEnd = parseTime(schedule.endsAt);

                return (
                    startMinute >= scheduleStart &&
                    endMinute <= scheduleEnd
                );
            });

            if (!belongsToSchedule) {
                throw new BadRequestException(
                    'Appointment duration exceeds the veterinarian working schedule',
                );
            }

            const [conflictingAppointment, conflictingBlock] =
                await Promise.all([
                    transaction.appointment.findFirst({
                        where: {
                            idAppointment: {
                                not: appointment.idAppointment,
                            },
                            veterinarianId: appointment.veterinarianId,
                            status: {
                                in: [
                                    AppointmentStatus.PENDING,
                                    AppointmentStatus.CONFIRMED,
                                    AppointmentStatus.IN_PROGRESS,
                                ],
                            },
                            startsAt: {
                                lt: endsAt,
                            },
                            endsAt: {
                                gt: appointment.startsAt,
                            },
                        },
                        select: {
                            idAppointment: true,
                        },
                    }),

                    transaction.appointmentBlock.findFirst({
                        where: {
                            staffId: appointment.veterinarianId,
                            startsAt: {
                                lt: endsAt,
                            },
                            endsAt: {
                                gt: appointment.startsAt,
                            },
                        },
                        select: {
                            idAppointmentBlock: true,
                        },
                    }),
                ]);

            if (conflictingAppointment) {
                throw new BadRequestException(
                    'Veterinarian already has another appointment during this period',
                );
            }

            if (conflictingBlock) {
                throw new BadRequestException(
                    'Veterinarian has a scheduled block during this period',
                );
            }

            const result = await transaction.appointment.updateMany({
                where: {
                    idAppointment: appointment.idAppointment,
                    status: AppointmentStatus.PENDING,
                    confirmationExpiresAt: {
                        gt: now,
                    },
                },
                data: {
                    endsAt,
                    status: AppointmentStatus.CONFIRMED,
                    confirmedAt: now,
                },
            });

            if (result.count !== 1) {
                throw new BadRequestException(
                    'Appointment could not be confirmed because its status changed',
                );
            }

            await transaction.appointmentHistory.create({
                data: {
                    appointmentId: appointment.idAppointment,
                    action: AppointmentHistoryAction.CONFIRMED,
                    reason: 'Appointment confirmed by staff',
                    performedByUserId: confirmedByUserId,
                },
            });

            return transaction.appointment.findUnique({
                where: {
                    idAppointment: appointment.idAppointment,
                },
            });
        });
    }

}