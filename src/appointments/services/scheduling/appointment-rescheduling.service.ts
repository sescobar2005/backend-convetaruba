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
import { RescheduleAppointmentDto } from '../../dto/reschedule-appointment.dto.js';
import { AppointmentExpirationService } from '../appointment-expiration.service.js';
import {
    getLocalDayRange,
    validateTimeZone,
} from '../../helpers/appointment-date.helper.js';
import {
    parseTime,
    SLOT_DURATION_MINUTES,
} from '../../helpers/appointment-time.helper.js';

@Injectable()
export class AppointmentReschedulingService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly expirationService: AppointmentExpirationService,
    ) {}

    async rescheduleAppointment(
        appointmentId: string,
        requestingUserId: string,
        isStaff: boolean,
        dto: RescheduleAppointmentDto,
    ) {
        const newStartsAt = new Date(dto.startsAt);

        if (Number.isNaN(newStartsAt.getTime())) {
            throw new BadRequestException('Invalid appointment start date');
        }

        if (!/(Z|[+-]\d{2}:\d{2})$/i.test(dto.startsAt)) {
            throw new BadRequestException(
                'Appointment start date must include a timezone',
            );
        }

        const now = new Date();

        if (newStartsAt <= now) {
            throw new BadRequestException(
                'Appointment start date must be in the future',
            );
        }

        return this.prisma.client.$transaction(async (transaction) => {
            const appointment = await transaction.appointment.findUnique({
                where: {
                    idAppointment: appointmentId,
                },
            });

            if (!appointment) {
                throw new NotFoundException('Appointment not found');
            }

            if (!isStaff && appointment.customerId !== requestingUserId) {
                throw new NotFoundException('Appointment not found');
            }

            if (
                appointment.status !== AppointmentStatus.PENDING &&
                appointment.status !== AppointmentStatus.CONFIRMED
            ) {
                throw new BadRequestException(
                    'Only pending or confirmed appointments can be rescheduled',
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

            const branch = await transaction.branch.findUnique({
                where: {
                    idBranch: dto.branchId,
                },
                select: {
                    idBranch: true,
                    isActive: true,
                    timeZone: true,
                },
            });

            if (!branch || !branch.isActive) {
                throw new BadRequestException(
                    'Selected branch is unavailable',
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

            const branchService = await transaction.branchService.findFirst({
                where: {
                    idBranchService: appointment.branchServiceId,
                    branchId: dto.branchId,
                    isActive: true,
                    service: {
                        isActive: true,
                        isPublished: true,
                    },
                },
            });

            if (!branchService) {
                throw new BadRequestException(
                    'The appointment service is unavailable at the selected branch',
                );
            }

            const localDate = formatInTimeZone(
                newStartsAt,
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
                    branchId: dto.branchId,
                    isActive: true,
                    startDate: {
                        lte: newStartsAt,
                    },
                    OR: [
                        {
                            endDate: null,
                        },
                        {
                            endDate: {
                                gt: newStartsAt,
                            },
                        },
                    ],
                },
            });

            if (!assignment) {
                throw new BadRequestException(
                    'Veterinarian is not assigned to the selected branch at that time',
                );
            }

            const schedules = await transaction.staffSchedule.findMany({
                where: {
                    staffId: dto.veterinarianId,
                    branchId: dto.branchId,
                    weekDay,
                    isActive: true,
                },
            });

            const newEndsAt =
                appointment.status === AppointmentStatus.PENDING
                    ? new Date(
                        newStartsAt.getTime() +
                        SLOT_DURATION_MINUTES * 60_000,
                    )
                    : new Date(
                        newStartsAt.getTime() +
                        (appointment.endsAt!.getTime() -
                            appointment.startsAt.getTime()),
                    );

            const startTime = formatInTimeZone(
                newStartsAt,
                branch.timeZone,
                'HH:mm',
            );

            const endTime = formatInTimeZone(
                newEndsAt,
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
                    (startMinutes - scheduleStart) %
                        SLOT_DURATION_MINUTES === 0
                );
            });

            if (!scheduleAllowsAppointment) {
                throw new BadRequestException(
                    'The new appointment time is outside the veterinarian schedule',
                );
            }

            if (newEndsAt > dayEndsAt || newStartsAt < dayStartsAt) {
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
                            lt: newEndsAt,
                        },
                        endsAt: {
                            gt: newStartsAt,
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
                            lt: newEndsAt,
                        },
                        endsAt: {
                            gt: newStartsAt,
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
                    branchId: dto.branchId,
                    veterinarianId: dto.veterinarianId,
                    startsAt: newStartsAt,
                    endsAt: newEndsAt,
                },
            });

            if (updated.count !== 1) {
                throw new BadRequestException(
                    'Appointment changed before rescheduling could be completed',
                );
            }

            await transaction.appointmentHistory.create({
                data: {
                    appointmentId,
                    performedByUserId: requestingUserId,
                    action: AppointmentHistoryAction.RESCHEDULED,
                    reason:
                        `Rescheduled from ${appointment.startsAt.toISOString()} ` +
                        `to ${newStartsAt.toISOString()}. ` +
                        `Previous branch: ${appointment.branchId}. ` +
                        `New branch: ${dto.branchId}. ` +
                        `Previous veterinarian: ${appointment.veterinarianId}. ` +
                        `New veterinarian: ${dto.veterinarianId}.`,
                },
            });

            return transaction.appointment.findUnique({
                where: {
                    idAppointment: appointmentId,
                },
                include: {
                    pet: true,
                    branch: true,
                    branchService: true,
                    veterinarian: true,
                },
            });
        });
    }

}