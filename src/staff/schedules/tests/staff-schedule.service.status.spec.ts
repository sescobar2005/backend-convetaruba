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

describe('StaffScheduleService - updateStatus', () => {
    let context: StaffScheduleServiceTestContext;

    const staffId = 'dc5d90b1-8b07-495c-acaa-64be578b4ae2';
    const branchId = '1b1a7f9e-5056-4c13-bf96-511e25738254';
    const scheduleId = '35969108-5698-4675-b618-565bd481982b';

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

    const schedule = {
        idStaffSchedule: scheduleId,
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

        context.prismaMock.client.staffSchedule.findFirst.mockResolvedValue(
            schedule,
        );

        context.prismaMock.client.branch.findUnique.mockResolvedValue(
            branch,
        );

        context.prismaMock.client.staffBranch.findFirst.mockResolvedValue(
            assignment,
        );

        context.prismaMock.client.staffSchedule.update.mockImplementation(
            async ({ data }) => ({
                ...schedule,
                ...data,
            }),
        );
    });

    it('should deactivate a schedule successfully', async () => {
        const result = await context.service.updateStatus(
            staffId,
            scheduleId,
            false,
        );

        expect(result).toEqual({
            ...schedule,
            isActive: false,
        });

        expect(
            context.prismaMock.client.staffSchedule.update,
        ).toHaveBeenCalledWith({
            where: { idStaffSchedule: scheduleId },
            data: { isActive: false },
        });

        expect(
            context.prismaMock.client.staffSchedule.findFirst,
        ).toHaveBeenCalledTimes(1);
    });

    it('should activate an inactive schedule successfully', async () => {
        context.prismaMock.client.staffSchedule.findFirst
            .mockResolvedValueOnce({
                ...schedule,
                isActive: false,
            })
            .mockResolvedValueOnce(null);

        context.prismaMock.client.staffSchedule.update.mockImplementation(
            async ({ data }) => ({
                ...schedule,
                isActive: data.isActive,
            }),
        );

        const result = await context.service.updateStatus(
            staffId,
            scheduleId,
            true,
        );

        expect(result.isActive).toBe(true);

        expect(
            context.prismaMock.client.branch.findUnique,
        ).toHaveBeenCalledWith({
            where: { idBranch: branchId },
        });

        expect(
            context.prismaMock.client.staffBranch.findFirst,
        ).toHaveBeenCalled();

        expect(
            context.prismaMock.client.staffSchedule.update,
        ).toHaveBeenCalledWith({
            where: { idStaffSchedule: scheduleId },
            data: { isActive: true },
        });
    });

    it('should throw NotFoundException when staff does not exist', async () => {
        context.prismaMock.client.staff.findUnique.mockResolvedValue(
            null,
        );

        await expect(
            context.service.updateStatus(staffId, scheduleId, false),
        ).rejects.toThrow(NotFoundException);

        expect(
            context.prismaMock.client.staffSchedule.update,
        ).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when schedule does not belong to staff', async () => {
        context.prismaMock.client.staffSchedule.findFirst.mockResolvedValue(
            null,
        );

        await expect(
            context.service.updateStatus(staffId, scheduleId, false),
        ).rejects.toThrow(NotFoundException);

        expect(
            context.prismaMock.client.staffSchedule.update,
        ).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when branch is inactive during reactivation', async () => {
        context.prismaMock.client.staffSchedule.findFirst.mockResolvedValue({
            ...schedule,
            isActive: false,
        });

        context.prismaMock.client.branch.findUnique.mockResolvedValue({
            ...branch,
            isActive: false,
        });

        await expect(
            context.service.updateStatus(staffId, scheduleId, true),
        ).rejects.toThrow(BadRequestException);

        expect(
            context.prismaMock.client.staffSchedule.update,
        ).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when branch does not exist during reactivation', async () => {
        context.prismaMock.client.staffSchedule.findFirst.mockResolvedValue({
            ...schedule,
            isActive: false,
        });

        context.prismaMock.client.branch.findUnique.mockResolvedValue(
            null,
        );

        await expect(
            context.service.updateStatus(staffId, scheduleId, true),
        ).rejects.toThrow(NotFoundException);

        expect(
            context.prismaMock.client.staffSchedule.update,
        ).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when staff is no longer assigned to the branch', async () => {
        context.prismaMock.client.staffSchedule.findFirst.mockResolvedValue({
            ...schedule,
            isActive: false,
        });

        context.prismaMock.client.staffBranch.findFirst.mockResolvedValue(
            null,
        );

        await expect(
            context.service.updateStatus(staffId, scheduleId, true),
        ).rejects.toThrow(ForbiddenException);

        expect(
            context.prismaMock.client.staffSchedule.update,
        ).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when reactivated schedule overlaps another active schedule', async () => {
        context.prismaMock.client.staffSchedule.findFirst
            .mockResolvedValueOnce({
                ...schedule,
                isActive: false,
            })
            .mockResolvedValueOnce({
                idStaffSchedule: 'another-schedule-id',
                startsAt: '10:00',
                endsAt: '13:00',
                isActive: true,
            });

        await expect(
            context.service.updateStatus(staffId, scheduleId, true),
        ).rejects.toThrow(ConflictException);

        expect(
            context.prismaMock.client.staffSchedule.update,
        ).not.toHaveBeenCalled();
    });

    it('should not revalidate branch assignment when schedule is already active', async () => {
        await context.service.updateStatus(
            staffId,
            scheduleId,
            true,
        );

        expect(
            context.prismaMock.client.branch.findUnique,
        ).not.toHaveBeenCalled();

        expect(
            context.prismaMock.client.staffBranch.findFirst,
        ).not.toHaveBeenCalled();
    });
});