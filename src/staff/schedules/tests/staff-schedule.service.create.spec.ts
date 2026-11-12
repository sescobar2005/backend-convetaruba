import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';

import {
    beforeEach,
    describe,
    expect,
    it,
} from 'vitest';

import { WeekDay } from '../../../../generated/prisma/client.js';

import {
    createStaffScheduleServiceTestContext,
    type StaffScheduleServiceTestContext,
} from './staff-schedule-test.utils.js';

describe('StaffScheduleService - create', () => {
    let context: StaffScheduleServiceTestContext;

    const staffId = 'dc5d90b1-8b07-495c-acaa-64be578b4ae2';
    const branchId = '1b1a7f9e-5056-4c13-bf96-511e25738254';

    const dto = {
        branchId,
        weekDay: WeekDay.MONDAY,
        startsAt: '09:00',
        endsAt: '12:00',
    };

    const staff = {
        idStaff: staffId,
        isActive: true,
    };

    const branch = {
        idBranch: branchId,
        isActive: true,
    };

    const assignment = {
        staffId,
        branchId,
        isActive: true,
    };

    const createdSchedule = {
        idStaffSchedule: '35969108-5698-4675-b618-565bd481982b',
        staffId,
        branchId,
        weekDay: WeekDay.MONDAY,
        startsAt: '09:00',
        endsAt: '12:00',
        isActive: true,
    };

    beforeEach(() => {
        context = createStaffScheduleServiceTestContext();

        context.prismaMock.client.staff.findUnique.mockResolvedValue(
            staff,
        );

        context.prismaMock.client.branch.findUnique.mockResolvedValue(
            branch,
        );

        context.prismaMock.client.staffBranch.findFirst.mockResolvedValue(
            assignment,
        );

        context.prismaMock.client.staffSchedule.findFirst.mockResolvedValue(
            null,
        );

        context.prismaMock.client.staffSchedule.create.mockResolvedValue(
            createdSchedule,
        );
    });

    it('should create a staff schedule successfully', async () => {
        const result = await context.service.create(staffId, dto);

        expect(result).toEqual(createdSchedule);

        expect(
            context.prismaMock.client.staffSchedule.create,
        ).toHaveBeenCalledWith({
            data: {
                staffId,
                branchId,
                weekDay: WeekDay.MONDAY,
                startsAt: '09:00',
                endsAt: '12:00',
            },
        });
    });

    it('should throw NotFoundException when staff does not exist', async () => {
        context.prismaMock.client.staff.findUnique.mockResolvedValue(
            null,
        );

        await expect(
            context.service.create(staffId, dto),
        ).rejects.toThrow(NotFoundException);

        expect(
            context.prismaMock.client.staffSchedule.create,
        ).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when staff is inactive', async () => {
        context.prismaMock.client.staff.findUnique.mockResolvedValue({
            ...staff,
            isActive: false,
        });

        await expect(
            context.service.create(staffId, dto),
        ).rejects.toThrow(BadRequestException);

        expect(
            context.prismaMock.client.staffSchedule.create,
        ).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when branch does not exist', async () => {
        context.prismaMock.client.branch.findUnique.mockResolvedValue(
            null,
        );

        await expect(
            context.service.create(staffId, dto),
        ).rejects.toThrow(NotFoundException);

        expect(
            context.prismaMock.client.staffSchedule.create,
        ).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when branch is inactive', async () => {
        context.prismaMock.client.branch.findUnique.mockResolvedValue({
            ...branch,
            isActive: false,
        });

        await expect(
            context.service.create(staffId, dto),
        ).rejects.toThrow(BadRequestException);

        expect(
            context.prismaMock.client.staffSchedule.create,
        ).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when staff is not assigned to the branch', async () => {
        context.prismaMock.client.staffBranch.findFirst.mockResolvedValue(
            null,
        );

        await expect(
            context.service.create(staffId, dto),
        ).rejects.toThrow(ForbiddenException);

        expect(
            context.prismaMock.client.staffSchedule.create,
        ).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when start time is not earlier than end time', async () => {
        const invalidDto = {
            ...dto,
            startsAt: '12:00',
            endsAt: '09:00',
        };

        await expect(
            context.service.create(staffId, invalidDto),
        ).rejects.toThrow(BadRequestException);

        expect(
            context.prismaMock.client.staffSchedule.create,
        ).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when start and end times are equal', async () => {
        const invalidDto = {
            ...dto,
            startsAt: '09:00',
            endsAt: '09:00',
        };

        await expect(
            context.service.create(staffId, invalidDto),
        ).rejects.toThrow(BadRequestException);

        expect(
            context.prismaMock.client.staffSchedule.create,
        ).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when schedule overlaps an active schedule', async () => {
        context.prismaMock.client.staffSchedule.findFirst.mockResolvedValue({
            idStaffSchedule: 'another-schedule-id',
            startsAt: '10:00',
            endsAt: '13:00',
            isActive: true,
        });

        await expect(
            context.service.create(staffId, dto),
        ).rejects.toThrow(ConflictException);

        expect(
            context.prismaMock.client.staffSchedule.create,
        ).not.toHaveBeenCalled();
    });

    it('should allow creating a schedule when there is no overlap', async () => {
        context.prismaMock.client.staffSchedule.findFirst.mockResolvedValue(
            null,
        );

        const result = await context.service.create(staffId, dto);

        expect(result).toEqual(createdSchedule);

        expect(
            context.prismaMock.client.staffSchedule.create,
        ).toHaveBeenCalledTimes(1);
    });
});