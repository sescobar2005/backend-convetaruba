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
import { CreateAppointmentDto } from '../../dto/create-appointment.dto.js';
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
export class AppointmentCreationService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly expirationService: AppointmentExpirationService,
    ) {}

    async createAppointment(
        customerId: string,
        createdByUserId: string,
        dto: CreateAppointmentDto,
    ) {
        const startsAt = new Date(dto.startsAt);

        if (Number.isNaN(startsAt.getTime())) {
            throw new BadRequestException('Invalid appointment start date');
        }

        if (!/(Z|[+-]\d{2}:\d{2})$/i.test(dto.startsAt)) {
            throw new BadRequestException(
                'Appointment start time must include a timezone',
            );
        }

        const now = new Date();

        if (startsAt <= now) {
            throw new BadRequestException(
                'Appointment start time must be in the future',
            );
        }

        const provisionalEndsAt = new Date(
            startsAt.getTime() + SLOT_DURATION_MINUTES * 60 * 1000,
        );

        const confirmationExpiresAt = new Date(
            now.getTime() + 15 * 60 * 1000,
        );

        return this.prisma.client.$transaction(async (transaction) => {
            const customer = await transaction.user.findUnique({
                where: {
                    idUser: customerId,
                },
                select: {
                    idUser: true,
                    role: true,
                },
            });

            if (!customer || customer.role.toString() !== 'CUSTOMER') {
                throw new NotFoundException('Customer not found');
            }

            const pet = await transaction.pet.findFirst({
                where: {
                    idPet: dto.petId,
                    ownerId: customerId,
                    isActive: true,
                },
                select: {
                    idPet: true,
                },
            });

            if (!pet) {
                throw new NotFoundException(
                    'Active pet not found for this customer',
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
                throw new NotFoundException('Active branch not found');
            }

            validateTimeZone(branch.timeZone);

            const veterinarian = await transaction.staff.findUnique({
                where: {
                    idStaff: dto.veterinarianId,
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

            const branchService = await transaction.branchService.findUnique({
                where: {
                    idBranchService: dto.branchServiceId,
                },
                select: {
                    idBranchService: true,
                    branchId: true,
                    isActive: true,
                    service: {
                        select: {
                            isActive: true,
                            isPublished: true,
                        },
                    },
                },
            });

            if (
                !branchService ||
                branchService.branchId !== branch.idBranch ||
                !branchService.isActive
            ) {
                throw new NotFoundException(
                    'Active service not found in this branch',
                );
            }

            if (
                !branchService.service.isActive ||
                !branchService.service.isPublished
            ) {
                throw new BadRequestException(
                    'The service is not available for appointments',
                );
            }

            const currentPrice =
                await transaction.branchServicePrice.findFirst({
                    where: {
                        branchServiceId: branchService.idBranchService,
                        validFrom: {
                            lte: now,
                        },
                        OR: [
                            {
                                validUntil: null,
                            },
                            {
                                validUntil: {
                                    gt: now,
                                },
                            },
                        ],
                    },
                    orderBy: {
                        validFrom: 'desc',
                    },
                    select: {
                        amount: true,
                    },
                });

            if (!currentPrice) {
                throw new BadRequestException(
                    'The service does not have a current price',
                );
            }

            const localDate = formatInTimeZone(
                startsAt,
                branch.timeZone,
                'yyyy-MM-dd',
            );

            const localTime = formatInTimeZone(
                startsAt,
                branch.timeZone,
                'HH:mm',
            );

            const {
                dayStartsAt,
                dayEndsAt,
                weekDay,
            } = getLocalDayRange(localDate, branch.timeZone);

            const assignment = await transaction.staffBranch.findFirst({
                where: {
                    staffId: veterinarian.idStaff,
                    branchId: branch.idBranch,
                    isActive: true,
                    startDate: {
                        lte: startsAt,
                    },
                    OR: [
                        {
                            endDate: null,
                        },
                        {
                            endDate: {
                                gte: startsAt,
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
                    'Veterinarian is not assigned to this branch at the requested time',
                );
            }

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
            });

            const requestedMinute = parseTime(localTime);

            const belongsToSchedule = schedules.some((schedule) => {
                const scheduleStart = parseTime(schedule.startsAt);
                const scheduleEnd = parseTime(schedule.endsAt);

                return (
                    requestedMinute >= scheduleStart &&
                    requestedMinute + SLOT_DURATION_MINUTES <= scheduleEnd &&
                    (requestedMinute - scheduleStart) %
                        SLOT_DURATION_MINUTES === 0
                );
            });

            if (!belongsToSchedule) {
                throw new BadRequestException(
                    'Requested time is not an available appointment slot',
                );
            }

            await this.expirationService.expirePendingAppointments(
                transaction,
                veterinarian.idStaff,
                now,
            );

            const [conflictingAppointment, conflictingBlock] =
                await Promise.all([
                    transaction.appointment.findFirst({
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
                                lt: provisionalEndsAt,
                            },
                            endsAt: {
                                gt: startsAt,
                            },
                        },
                        select: {
                            idAppointment: true,
                        },
                    }),

                    transaction.appointmentBlock.findFirst({
                        where: {
                            staffId: veterinarian.idStaff,
                            startsAt: {
                                lt: provisionalEndsAt,
                            },
                            endsAt: {
                                gt: startsAt,
                            },
                        },
                        select: {
                            idAppointmentBlock: true,
                        },
                    }),
                ]);

            if (conflictingAppointment) {
                throw new BadRequestException(
                    'Veterinarian already has an appointment at this time',
                );
            }

            if (conflictingBlock) {
                throw new BadRequestException(
                    'Veterinarian is unavailable due to a scheduled block',
                );
            }

            const appointment = await transaction.appointment.create({
                data: {
                    customerId: customer.idUser,
                    createdByUserId,
                    petId: pet.idPet,
                    branchId: branch.idBranch,
                    branchServiceId: branchService.idBranchService,
                    veterinarianId: veterinarian.idStaff,
                    startsAt,
                    endsAt: provisionalEndsAt,
                    status: AppointmentStatus.PENDING,
                    priceAtBooking: currentPrice.amount,
                    confirmationExpiresAt,
                    notes: dto.notes?.trim() || null,
                },
            });

            await transaction.appointmentHistory.create({
                data: {
                    appointmentId: appointment.idAppointment,
                    action: AppointmentHistoryAction.CREATED,
                    reason: 'Appointment request created',
                },
            });

            return appointment;
        });
    }
    
}