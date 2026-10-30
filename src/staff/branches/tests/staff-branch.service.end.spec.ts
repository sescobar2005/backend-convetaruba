import {
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';

import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import type {
    EndStaffBranchDto,
} from '../dto/end-staff-branch.dto.js';

import { createStaffBranchServiceTestContext } from './staff-branch-test.utils.js';

describe('StaffBranchService - end assignment', () => {
    let service: ReturnType<
        typeof createStaffBranchServiceTestContext
    >['service'];

    let prismaMock: ReturnType<
        typeof createStaffBranchServiceTestContext
    >['prismaMock'];

    const staffId = '660e8400-e29b-41d4-a716-446655440000';
    const branchId = '550e8400-e29b-41d4-a716-446655440000';
    const assignmentId = '880e8400-e29b-41d4-a716-446655440000';

    const startDate = new Date('2026-01-15T10:00:00.000Z');
    const endDate = new Date('2026-06-30T18:00:00.000Z');

    const activeAssignment = {
        idStaffBranch: assignmentId,
        staffId,
        branchId,
        startDate,
        endDate: null,
        isActive: true,
        createdAt: startDate,
        updatedAt: startDate,
    };

    const endedAssignment = {
        ...activeAssignment,
        endDate,
        isActive: false,
        updatedAt: endDate,
    };

    const endStaffBranchDto: EndStaffBranchDto = {
        endDate: endDate.toISOString(),
    };

    beforeEach(() => {
        ({ service, prismaMock } = createStaffBranchServiceTestContext());
    });

    it('should end a staff branch assignment successfully', async () => {
        prismaMock.client.staffBranch.findFirst.mockResolvedValue(
            activeAssignment,
        );

        prismaMock.client.staffBranch.update.mockResolvedValue(
            endedAssignment,
        );

        const result = await service.endStaffBranchAssignment(
            staffId,
            assignmentId,
            endStaffBranchDto,
        );

        expect(result).toEqual(endedAssignment);

        expect(prismaMock.client.staffBranch.findFirst).toHaveBeenCalledWith({
            where: {
                idStaffBranch: assignmentId,
                staffId,
            },
        });

        expect(prismaMock.client.staffBranch.update).toHaveBeenCalledWith({
            where: {
                idStaffBranch: assignmentId,
            },
            data: {
                endDate,
                isActive: false,
            },
        });
    });

    it('should use the current date when no end date is provided', async () => {
        const currentDate = new Date('2026-07-15T15:00:00.000Z');

        vi.setSystemTime(currentDate);

        prismaMock.client.staffBranch.findFirst.mockResolvedValue(
            activeAssignment,
        );

        prismaMock.client.staffBranch.update.mockResolvedValue({
            ...activeAssignment,
            endDate: currentDate,
            isActive: false,
            updatedAt: currentDate,
        });

        const result = await service.endStaffBranchAssignment(
            staffId,
            assignmentId,
            {},
        );

        expect(result.endDate).toEqual(currentDate);

        expect(prismaMock.client.staffBranch.update).toHaveBeenCalledWith({
            where: {
                idStaffBranch: assignmentId,
            },
            data: {
                endDate: currentDate,
                isActive: false,
            },
        });

        vi.useRealTimers();
    });

    it('should throw NotFoundException when the assignment does not exist', async () => {
        prismaMock.client.staffBranch.findFirst.mockResolvedValue(null);

        await expect(
            service.endStaffBranchAssignment(
                staffId,
                assignmentId,
                endStaffBranchDto,
            ),
        ).rejects.toThrow(NotFoundException);

        expect(prismaMock.client.staffBranch.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when the assignment has already ended', async () => {
        prismaMock.client.staffBranch.findFirst.mockResolvedValue({
            ...activeAssignment,
            endDate,
            isActive: false,
        });

        await expect(
            service.endStaffBranchAssignment(
                staffId,
                assignmentId,
                endStaffBranchDto,
            ),
        ).rejects.toThrow(BadRequestException);

        expect(prismaMock.client.staffBranch.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when the end date is earlier than the start date', async () => {
        const invalidDto: EndStaffBranchDto = {
            endDate: '2026-01-10T10:00:00.000Z',
        };

        prismaMock.client.staffBranch.findFirst.mockResolvedValue(
            activeAssignment,
        );

        await expect(
            service.endStaffBranchAssignment(
                staffId,
                assignmentId,
                invalidDto,
            ),
        ).rejects.toThrow(BadRequestException);

        expect(prismaMock.client.staffBranch.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when the end date equals the start date', async () => {
        const invalidDto: EndStaffBranchDto = {
            endDate: startDate.toISOString(),
        };

        prismaMock.client.staffBranch.findFirst.mockResolvedValue(
            activeAssignment,
        );

        await expect(
            service.endStaffBranchAssignment(
                staffId,
                assignmentId,
                invalidDto,
            ),
        ).rejects.toThrow(BadRequestException);

        expect(prismaMock.client.staffBranch.update).not.toHaveBeenCalled();
    });

    it('should propagate unexpected database errors', async () => {
        const databaseError = new Error('Database connection failed');

        prismaMock.client.staffBranch.findFirst.mockResolvedValue(
            activeAssignment,
        );

        prismaMock.client.staffBranch.update.mockRejectedValue(
            databaseError,
        );

        await expect(
            service.endStaffBranchAssignment(
                staffId,
                assignmentId,
                endStaffBranchDto,
            ),
        ).rejects.toThrow(databaseError);
    });
});