import { NotFoundException } from '@nestjs/common';

import {
    beforeEach,
    describe,
    expect,
    it,
} from 'vitest';

import {
    createStaffScheduleServiceTestContext,
    type StaffScheduleServiceTestContext,
} from './staff-schedule-test.utils.js';

describe('StaffScheduleService - findAll', () => {
    let context: StaffScheduleServiceTestContext;

    const staffId = 'dc5d90b1-8b07-495c-acaa-64be578b4ae2';
    const branchId = '1b1a7f9e-5056-4c13-bf96-511e25738254';

    const staff = {
        idStaff: staffId,
        isActive: true,
    };

    const schedules = [
        {
            idStaffSchedule: '35969108-5698-4675-b618-565bd481982b',
            staffId,
            branchId,
            weekDay: 'MONDAY',
            startsAt: '09:00',
            endsAt: '12:00',
            isActive: true,
            branch: {
                idBranch: branchId,
                name: 'Convet Sucursal Medellín',
            },
        },
        {
            idStaffSchedule: '45969108-5698-4675-b618-565bd481982c',
            staffId,
            branchId,
            weekDay: 'TUESDAY',
            startsAt: '14:00',
            endsAt: '18:00',
            isActive: true,
            branch: {
                idBranch: branchId,
                name: 'Convet Sucursal Medellín',
            },
        },
    ];

    beforeEach(() => {
        context = createStaffScheduleServiceTestContext();

        context.prismaMock.client.staff.findUnique.mockResolvedValue(
            staff,
        );

        context.prismaMock.client.staffSchedule.findMany.mockResolvedValue(
            schedules,
        );
    });

    it('should return all schedules belonging to the staff member', async () => {
        const result = await context.service.findAll(staffId);

        expect(result).toEqual(schedules);

        expect(
            context.prismaMock.client.staffSchedule.findMany,
        ).toHaveBeenCalledWith({
            where: { staffId },
            include: {
                branch: true,
            },
            orderBy: [
                { weekDay: 'asc' },
                { startsAt: 'asc' },
            ],
        });
    });

    it('should return an empty array when staff has no schedules', async () => {
        context.prismaMock.client.staffSchedule.findMany.mockResolvedValue(
            [],
        );

        const result = await context.service.findAll(staffId);

        expect(result).toEqual([]);
    });

    it('should throw NotFoundException when staff does not exist', async () => {
        context.prismaMock.client.staff.findUnique.mockResolvedValue(
            null,
        );

        await expect(
            context.service.findAll(staffId),
        ).rejects.toThrow(NotFoundException);

        expect(
            context.prismaMock.client.staffSchedule.findMany,
        ).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when staff schedules cannot be queried due to missing staff', async () => {
        context.prismaMock.client.staff.findUnique.mockResolvedValue(
            null,
        );

        await expect(
            context.service.findAll(staffId),
        ).rejects.toThrow(NotFoundException);
    });
});