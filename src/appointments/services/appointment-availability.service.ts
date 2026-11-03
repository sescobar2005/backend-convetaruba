import {
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import {
    AppointmentStatus,
    StaffPosition,
} from '../../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { GetAppointmentAvailabilityDto } from '../dto/get-appointment-availability.dto.js';
import { AppointmentExpirationService } from './appointment-expiration.service.js';
import { getLocalDayRange, validateDate, validateTimeZone } from '../helpers/appointment-date.helper.js';
import {
    minutesToTime,
    parseTime,
    SLOT_DURATION_MINUTES,
} from '../helpers/appointment-time.helper.js';

interface TimeInterval {
    startsAt: Date;
    endsAt: Date;
}

@Injectable()
export class AppointmentAvailabilityService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly expirationService: AppointmentExpirationService,
    ) {}

    async getAvailability(query: GetAppointmentAvailabilityDto) {
        validateDate(query.date);

        return this.prisma.client.$transaction(async (transaction) => {
            const now = new Date();

            const branch = await transaction.branch.findUnique({
                where: {
                    idBranch: query.branchId,
                },
                select: {
                    idBranch: true,
                    isActive: true,
                    timeZone: true,
                },
            });

            if (!branch || !branch.isActive) {
                throw new NotFoundException('Active branch not found');
            }

            validateTimeZone(branch.timeZone);

            const veterinarian = await transaction.staff.findUnique({
                where: {
                    idStaff: query.veterinarianId,
                },
                select: {
                    idStaff: true,
                    position: true,
                    isActive: true,
                },
            });

            if (
                !veterinarian ||
                !veterinarian.isActive ||
                veterinarian.position !== StaffPosition.VETERINARIAN
            ) {
                throw new NotFoundException('Active veterinarian not found');
            }

            const {
                dayStartsAt,
                dayEndsAt,
                weekDay,
            } = getLocalDayRange(query.date, branch.timeZone);

            const assignment = await transaction.staffBranch.findFirst({
                where: {
                    staffId: veterinarian.idStaff,
                    branchId: branch.idBranch,
                    isActive: true,
                    startDate: {
                        lte: dayEndsAt,
                    },
                    OR: [
                        {
                            endDate: null,
                        },
                        {
                            endDate: {
                                gte: dayStartsAt,
                            },
                        },
                    ],
                },
                select: {
                    idStaffBranch: true,
                },
            });

            if (!assignment) {
                throw new NotFoundException(
                    'Veterinarian is not assigned to this branch on the requested date',
                );
            }

            await this.expirationService.expirePendingAppointments(
                transaction,
                veterinarian.idStaff,
                now,
            );

            const schedules = await transaction.staffSchedule.findMany({
                where: {
                    staffId: veterinarian.idStaff,
                    branchId: branch.idBranch,
                    weekDay,
                    isActive: true,
                },
                select: {
                    startsAt: true,
                    endsAt: true,
                },
                orderBy: {
                    startsAt: 'asc',
                },
            });

            if (schedules.length === 0) {
                return this.buildAvailabilityResponse(query, branch.timeZone, []);
            }

            const [appointments, blocks] = await Promise.all([
                transaction.appointment.findMany({
                    where: {
                        veterinarianId: veterinarian.idStaff,
                        status: {
                            in: [
                                AppointmentStatus.PENDING,
                                AppointmentStatus.CONFIRMED,
                                AppointmentStatus.IN_PROGRESS,
                            ],
                        },
                        startsAt: {
                            lt: dayEndsAt,
                        },
                        endsAt: {
                            gt: dayStartsAt,
                        },
                    },
                    select: {
                        startsAt: true,
                        endsAt: true,
                    },
                }),
                transaction.appointmentBlock.findMany({
                    where: {
                        staffId: veterinarian.idStaff,
                        startsAt: {
                            lt: dayEndsAt,
                        },
                        endsAt: {
                            gt: dayStartsAt,
                        },
                    },
                    select: {
                        startsAt: true,
                        endsAt: true,
                    },
                }),
            ]);

            const occupiedIntervals: TimeInterval[] = [
                ...appointments
                    .filter(
                        (
                            appointment,
                        ): appointment is typeof appointment & {
                            endsAt: Date;
                        } => appointment.endsAt !== null,
                    )
                    .map((appointment) => ({
                        startsAt: appointment.startsAt,
                        endsAt: appointment.endsAt,
                    })),
                ...blocks.map((block) => ({
                    startsAt: block.startsAt,
                    endsAt: block.endsAt,
                })),
            ];

            const availableSlots: Array<{
                startsAt: string;
                localTime: string;
            }> = [];

            for (const schedule of schedules) {
                const scheduleStart = parseTime(schedule.startsAt);
                const scheduleEnd = parseTime(schedule.endsAt);

                if (scheduleStart >= scheduleEnd) {
                    continue;
                }

                for (
                    let minute = scheduleStart;
                    minute + SLOT_DURATION_MINUTES <= scheduleEnd;
                    minute += SLOT_DURATION_MINUTES
                ) {
                    const localTime = minutesToTime(minute);

                    const slotStartsAt = fromZonedTime(
                        `${query.date}T${localTime}:00`,
                        branch.timeZone,
                    );

                    const slotEndsAt = new Date(
                        slotStartsAt.getTime() +
                            SLOT_DURATION_MINUTES * 60 * 1000,
                    );

                    if (slotStartsAt <= now) {
                        continue;
                    }

                    const hasConflict = occupiedIntervals.some(
                        (interval) =>
                            slotStartsAt < interval.endsAt &&
                            slotEndsAt > interval.startsAt,
                    );

                    if (hasConflict) {
                        continue;
                    }

                    availableSlots.push({
                        startsAt: slotStartsAt.toISOString(),
                        localTime: formatInTimeZone(
                            slotStartsAt,
                            branch.timeZone,
                            'HH:mm',
                        ),
                    });
                }
            }

            return this.buildAvailabilityResponse(
                query,
                branch.timeZone,
                availableSlots,
            );
        });
    }

    private buildAvailabilityResponse(
        query: GetAppointmentAvailabilityDto,
        timeZone: string,
        availableSlots: Array<{
            startsAt: string;
            localTime: string;
        }>,
    ) {
        return {
            branchId: query.branchId,
            veterinarianId: query.veterinarianId,
            date: query.date,
            timeZone,
            availableSlots,
        };
    }
}