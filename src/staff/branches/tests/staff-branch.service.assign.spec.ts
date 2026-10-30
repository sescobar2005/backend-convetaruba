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

import type {
    AssignStaffBranchDto,
} from '../dto/assign-staff-branch.dto.js';

import { createStaffBranchServiceTestContext } from './staff-branch-test.utils.js';

describe('StaffBranchService - assign', () => {
    let service: ReturnType<
        typeof createStaffBranchServiceTestContext
    >['service'];

    let prismaMock: ReturnType<
        typeof createStaffBranchServiceTestContext
    >['prismaMock'];

    const staffId = '660e8400-e29b-41d4-a716-446655440000';
    const branchId = '550e8400-e29b-41d4-a716-446655440000';

    const assignStaffBranchDto: AssignStaffBranchDto = {
        branchId,
    };

    const activeStaff = {
        idStaff: staffId,
        isActive: true,
    };

    const inactiveStaff = {
        idStaff: staffId,
        isActive: false,
    };

    const activeBranch = {
        idBranch: branchId,
        isActive: true,
    };

    const inactiveBranch = {
        idBranch: branchId,
        isActive: false,
    };

    const createdAssignment = {
        idStaffBranch: '880e8400-e29b-41d4-a716-446655440000',
        staffId,
        branchId,
        startDate: new Date('2026-01-15T10:00:00.000Z'),
        endDate: null,
        isActive: true,
        createdAt: new Date('2026-01-15T10:00:00.000Z'),
        updatedAt: new Date('2026-01-15T10:00:00.000Z'),
    };

    beforeEach(() => {
        ({ service, prismaMock } = createStaffBranchServiceTestContext());
    });

    it('should assign an active staff member to an active branch successfully', async () => {
        prismaMock.client.staff.findUnique.mockResolvedValue(activeStaff);

        prismaMock.client.branch.findUnique.mockResolvedValue(activeBranch);

        prismaMock.client.staffBranch.findFirst.mockResolvedValue(null);

        prismaMock.client.staffBranch.create.mockResolvedValue(
            createdAssignment,
        );

        const result = await service.assignStaffToBranch(
            staffId,
            assignStaffBranchDto,
        );

        expect(result).toEqual(createdAssignment);

        expect(prismaMock.client.staff.findUnique).toHaveBeenCalledWith({
            where: {
                idStaff: staffId,
            },
            select: {
                idStaff: true,
                isActive: true,
            },
        });

        expect(prismaMock.client.branch.findUnique).toHaveBeenCalledWith({
            where: {
                idBranch: branchId,
            },
            select: {
                idBranch: true,
                isActive: true,
            },
        });

        expect(prismaMock.client.staffBranch.findFirst).toHaveBeenCalledWith({
            where: {
                staffId,
                branchId,
                isActive: true,
            },
            select: {
                idStaffBranch: true,
            },
        });

        expect(prismaMock.client.staffBranch.create).toHaveBeenCalledWith({
            data: {
                staffId,
                branchId,
            },
        });
    });

    it('should throw NotFoundException when the staff member does not exist', async () => {
        prismaMock.client.staff.findUnique.mockResolvedValue(null);

        prismaMock.client.branch.findUnique.mockResolvedValue(activeBranch);

        await expect(
            service.assignStaffToBranch(staffId, assignStaffBranchDto),
        ).rejects.toThrow(NotFoundException);

        expect(prismaMock.client.staffBranch.findFirst).not.toHaveBeenCalled();

        expect(prismaMock.client.staffBranch.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when the branch does not exist', async () => {
        prismaMock.client.staff.findUnique.mockResolvedValue(activeStaff);

        prismaMock.client.branch.findUnique.mockResolvedValue(null);

        await expect(
            service.assignStaffToBranch(staffId, assignStaffBranchDto),
        ).rejects.toThrow(NotFoundException);

        expect(prismaMock.client.staffBranch.findFirst).not.toHaveBeenCalled();

        expect(prismaMock.client.staffBranch.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when the staff member is inactive', async () => {
        prismaMock.client.staff.findUnique.mockResolvedValue(inactiveStaff);

        prismaMock.client.branch.findUnique.mockResolvedValue(activeBranch);

        await expect(
            service.assignStaffToBranch(staffId, assignStaffBranchDto),
        ).rejects.toThrow(BadRequestException);

        expect(prismaMock.client.staffBranch.findFirst).not.toHaveBeenCalled();

        expect(prismaMock.client.staffBranch.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when the branch is inactive', async () => {
        prismaMock.client.staff.findUnique.mockResolvedValue(activeStaff);

        prismaMock.client.branch.findUnique.mockResolvedValue(inactiveBranch);

        await expect(
            service.assignStaffToBranch(staffId, assignStaffBranchDto),
        ).rejects.toThrow(BadRequestException);

        expect(prismaMock.client.staffBranch.findFirst).not.toHaveBeenCalled();

        expect(prismaMock.client.staffBranch.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when the staff member is already assigned to the branch', async () => {
        prismaMock.client.staff.findUnique.mockResolvedValue(activeStaff);

        prismaMock.client.branch.findUnique.mockResolvedValue(activeBranch);

        prismaMock.client.staffBranch.findFirst.mockResolvedValue({
            idStaffBranch: createdAssignment.idStaffBranch,
        });

        await expect(
            service.assignStaffToBranch(staffId, assignStaffBranchDto),
        ).rejects.toThrow(ConflictException);

        expect(prismaMock.client.staffBranch.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when Prisma returns a unique constraint error', async () => {
        prismaMock.client.staff.findUnique.mockResolvedValue(activeStaff);

        prismaMock.client.branch.findUnique.mockResolvedValue(activeBranch);

        prismaMock.client.staffBranch.findFirst.mockResolvedValue(null);

        prismaMock.client.staffBranch.create.mockRejectedValue(
            Object.assign(new Error('Unique constraint failed'), {
                code: 'P2002',
            }),
        );

        await expect(
            service.assignStaffToBranch(staffId, assignStaffBranchDto),
        ).rejects.toThrow(ConflictException);
    });

    it('should propagate unexpected database errors', async () => {
        const databaseError = new Error('Database connection failed');

        prismaMock.client.staff.findUnique.mockResolvedValue(activeStaff);

        prismaMock.client.branch.findUnique.mockResolvedValue(activeBranch);

        prismaMock.client.staffBranch.findFirst.mockResolvedValue(null);

        prismaMock.client.staffBranch.create.mockRejectedValue(databaseError);

        await expect(
            service.assignStaffToBranch(staffId, assignStaffBranchDto),
        ).rejects.toThrow(databaseError);
    });
});