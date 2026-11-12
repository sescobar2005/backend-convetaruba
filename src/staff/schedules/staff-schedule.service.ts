import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateStaffScheduleDto } from './dto/create-staff-schedule.dto.js';
import { UpdateStaffScheduleDto } from './dto/update-staff-schedule.dto.js';

@Injectable()
export class StaffScheduleService {
    constructor(private readonly prisma: PrismaService) {}

    private async validateStaff(staffId: string) {
        const staff = await this.prisma.client.staff.findUnique({
            where: { idStaff: staffId },
        });

        if (!staff) {
            throw new NotFoundException('Staff member not found');
        }

        if (!staff.isActive) {
            throw new BadRequestException('Staff member is inactive');
        }

        return staff;
    }

    private async validateBranch(branchId: string) {
        const branch = await this.prisma.client.branch.findUnique({
            where: { idBranch: branchId },
        });

        if (!branch) {
            throw new NotFoundException('Branch not found');
        }

        if (!branch.isActive) {
            throw new BadRequestException('Branch is inactive');
        }

        return branch;
    }

    private async validateStaffBranchAssignment(
        staffId: string,
        branchId: string,
    ) {
        const now = new Date();

        const assignment = await this.prisma.client.staffBranch.findFirst({
            where: {
                staffId,
                branchId,
                isActive: true,
                startDate: { lte: now },
                OR: [
                    { endDate: null },
                    { endDate: { gte: now } },
                ],
            },
        });

        if (!assignment) {
            throw new ForbiddenException(
                'Staff member is not actively assigned to this branch',
            );
        }
    }

    private validateTimeRange(startsAt: string, endsAt: string) {
        if (startsAt >= endsAt) {
            throw new BadRequestException(
                'Start time must be earlier than end time',
            );
        }
    }

    private async validateNoOverlap(
        staffId: string,
        branchId: string,
        weekDay: string,
        startsAt: string,
        endsAt: string,
        excludedScheduleId?: string,
    ) {
        const overlappingSchedule =
            await this.prisma.client.staffSchedule.findFirst({
                where: {
                    staffId,
                    branchId,
                    weekDay: weekDay as never,
                    isActive: true,
                    startsAt: { lt: endsAt },
                    endsAt: { gt: startsAt },
                    ...(excludedScheduleId
                        ? {
                              idStaffSchedule: {
                                  not: excludedScheduleId,
                              },
                          }
                        : {}),
                },
            });

        if (overlappingSchedule) {
            throw new ConflictException(
                'The schedule overlaps with another active schedule',
            );
        }
    }

    async create(staffId: string, dto: CreateStaffScheduleDto) {
        await this.validateStaff(staffId);
        await this.validateBranch(dto.branchId);

        await this.validateStaffBranchAssignment(
            staffId,
            dto.branchId,
        );

        this.validateTimeRange(dto.startsAt, dto.endsAt);

        await this.validateNoOverlap(
            staffId,
            dto.branchId,
            dto.weekDay,
            dto.startsAt,
            dto.endsAt,
        );

        return this.prisma.client.staffSchedule.create({
            data: {
                staffId,
                branchId: dto.branchId,
                weekDay: dto.weekDay,
                startsAt: dto.startsAt,
                endsAt: dto.endsAt,
            },
        });
    }

    async findAll(staffId: string) {
        await this.validateStaff(staffId);

        return this.prisma.client.staffSchedule.findMany({
            where: { staffId },
            include: {
                branch: true,
            },
            orderBy: [
                { weekDay: 'asc' },
                { startsAt: 'asc' },
            ],
        });
    }

    async update(
        staffId: string,
        scheduleId: string,
        dto: UpdateStaffScheduleDto,
    ) {
        await this.validateStaff(staffId);

        const schedule =
            await this.prisma.client.staffSchedule.findFirst({
                where: {
                    idStaffSchedule: scheduleId,
                    staffId,
                },
            });

        if (!schedule) {
            throw new NotFoundException('Staff schedule not found');
        }

        const startsAt = dto.startsAt ?? schedule.startsAt;
        const endsAt = dto.endsAt ?? schedule.endsAt;
        const weekDay = dto.weekDay ?? schedule.weekDay;

        this.validateTimeRange(startsAt, endsAt);

        if (schedule.isActive) {
            await this.validateNoOverlap(
                staffId,
                schedule.branchId,
                weekDay,
                startsAt,
                endsAt,
                scheduleId,
            );
        }

        return this.prisma.client.staffSchedule.update({
            where: { idStaffSchedule: scheduleId },
            data: {
                ...(dto.weekDay !== undefined && {
                    weekDay: dto.weekDay,
                }),
                ...(dto.startsAt !== undefined && {
                    startsAt: dto.startsAt,
                }),
                ...(dto.endsAt !== undefined && {
                    endsAt: dto.endsAt,
                }),
            },
        });
    }

    async updateStatus(
        staffId: string,
        scheduleId: string,
        isActive: boolean,
    ) {
        await this.validateStaff(staffId);

        const schedule =
            await this.prisma.client.staffSchedule.findFirst({
                where: {
                    idStaffSchedule: scheduleId,
                    staffId,
                },
            });

        if (!schedule) {
            throw new NotFoundException('Staff schedule not found');
        }

        if (isActive && !schedule.isActive) {
            await this.validateBranch(schedule.branchId);

            await this.validateStaffBranchAssignment(
                staffId,
                schedule.branchId,
            );

            await this.validateNoOverlap(
                staffId,
                schedule.branchId,
                schedule.weekDay,
                schedule.startsAt,
                schedule.endsAt,
                scheduleId,
            );
        }

        return this.prisma.client.staffSchedule.update({
            where: { idStaffSchedule: scheduleId },
            data: { isActive },
        });
    }
}