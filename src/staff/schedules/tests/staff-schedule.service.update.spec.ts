import {
    BadRequestException,
    ConflictException,
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

describe('StaffScheduleService - update', () => {
    let context: StaffScheduleServiceTestContext;

    const staffId = 'dc5d90b1-8b07-495c-acaa-64be578b4ae2';
    const branchId = '1b1a7f9e-5056-4c13-bf96-511e25738254';
    const scheduleId = '35969108-5698-4675-b618-565bd481982b';

    const staff = {
        idStaff: staffId,
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

        context.prismaMock.client.staffSchedule.findFirst.mockImplementation(
            async ({ where }) => {
                if (where.idStaffSchedule === scheduleId) {
                    return schedule;
                }

                return null;
            },
        );

        context.prismaMock.client.staffSchedule.update.mockImplementation(
            async ({ data }) => ({
                ...schedule,
                ...data,
            }),
        );
    });

    it('should update schedule times successfully', async () => {
        const dto = {
            startsAt: '10:00',
            endsAt: '13:00',
        };

        const result = await context.service.update(
            staffId,
            scheduleId,
            dto,
        );

        expect(result).toEqual({
            ...schedule,
            startsAt: '10:00',
            endsAt: '13:00',
        });

        expect(
            context.prismaMock.client.staffSchedule.update,
        ).toHaveBeenCalledWith({
            where: { idStaffSchedule: scheduleId },
            data: {
                startsAt: '10:00',
                endsAt: '13:00',
            },
        });
    });

    it('should update the schedule weekday successfully', async () => {
        const dto = {
            weekDay: WeekDay.TUESDAY,
        };

        const result = await context.service.update(
            staffId,
            scheduleId,
            dto,
        );

        expect(result.weekDay).toBe(WeekDay.TUESDAY);
    });

    it('should preserve existing values when fields are omitted', async () => {
        const result = await context.service.update(
            staffId,
            scheduleId,
            {},
        );

        expect(result).toEqual(schedule);

        expect(
            context.prismaMock.client.staffSchedule.update,
        ).toHaveBeenCalledWith({
            where: { idStaffSchedule: scheduleId },
            data: {},
        });
    });

    it('should throw NotFoundException when staff does not exist', async () => {
        context.prismaMock.client.staff.findUnique.mockResolvedValue(
            null,
        );

        await expect(
            context.service.update(staffId, scheduleId, {}),
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
            context.service.update(staffId, scheduleId, {}),
        ).rejects.toThrow(NotFoundException);

        expect(
            context.prismaMock.client.staffSchedule.update,
        ).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when start time is not earlier than end time', async () => {
        await expect(
            context.service.update(staffId, scheduleId, {
                startsAt: '13:00',
            }),
        ).rejects.toThrow(BadRequestException);

        expect(
            context.prismaMock.client.staffSchedule.update,
        ).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when start and end times are equal', async () => {
        await expect(
            context.service.update(staffId, scheduleId, {
                startsAt: '12:00',
            }),
        ).rejects.toThrow(BadRequestException);

        expect(
            context.prismaMock.client.staffSchedule.update,
        ).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when updated schedule overlaps another active schedule', async () => {
        context.prismaMock.client.staffSchedule.findFirst
            .mockImplementationOnce(async () => schedule)
            .mockImplementationOnce(async () => ({
                idStaffSchedule: 'another-schedule-id',
                startsAt: '10:00',
                endsAt: '14:00',
                isActive: true,
            }));

        await expect(
            context.service.update(staffId, scheduleId, {
                startsAt: '11:00',
                endsAt: '13:00',
            }),
        ).rejects.toThrow(ConflictException);

        expect(
            context.prismaMock.client.staffSchedule.update,
        ).not.toHaveBeenCalled();
    });

    it('should exclude the current schedule when checking overlaps', async () => {
        await context.service.update(staffId, scheduleId, {
            startsAt: '10:00',
            endsAt: '13:00',
        });

        expect(
            context.prismaMock.client.staffSchedule.findFirst,
        ).toHaveBeenNthCalledWith(2, {
            where: {
                staffId,
                branchId,
                weekDay: WeekDay.MONDAY,
                isActive: true,
                startsAt: { lt: '13:00' },
                endsAt: { gt: '10:00' },
                idStaffSchedule: {
                    not: scheduleId,
                },
            },
        });
    });
});