import {
    ForbiddenException,
} from '@nestjs/common';

import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import { Role } from '../../../generated/prisma/enums.js';
import { AssignStaffBranchDto } from './dto/assign-staff-branch.dto.js';
import { EndStaffBranchDto } from './dto/end-staff-branch.dto.js';
import { StaffBranchController } from './staff-branch.controller.js';
import { StaffBranchService } from './staff-branch.service.js';

describe('StaffBranchController', () => {
    let controller: StaffBranchController;
    let staffBranchServiceMock: {
        assignStaffToBranch: ReturnType<typeof vi.fn>;
        findStaffBranches: ReturnType<typeof vi.fn>;
        findBranchStaff: ReturnType<typeof vi.fn>;
        endStaffBranchAssignment: ReturnType<typeof vi.fn>;
    };

    const staffId = '660e8400-e29b-41d4-a716-446655440000';
    const branchId = '550e8400-e29b-41d4-a716-446655440000';
    const assignmentId = '880e8400-e29b-41d4-a716-446655440000';

    const adminRequest = {
        user: {
            role: Role.ADMIN,
        },
    };

    const customerRequest = {
        user: {
            role: Role.CUSTOMER,
        },
    };

    const staffRequest = {
        user: {
            role: Role.STAFF,
        },
    };

    const assignStaffBranchDto: AssignStaffBranchDto = {
        branchId,
    };

    const endStaffBranchDto: EndStaffBranchDto = {
        endDate: '2026-06-30T18:00:00.000Z',
    };

    const assignment = {
        idStaffBranch: assignmentId,
        staffId,
        branchId,
        startDate: new Date('2026-01-15T10:00:00.000Z'),
        endDate: null,
        isActive: true,
    };

    const endedAssignment = {
        ...assignment,
        endDate: new Date('2026-06-30T18:00:00.000Z'),
        isActive: false,
    };

    beforeEach(() => {
        staffBranchServiceMock = {
            assignStaffToBranch: vi.fn(),
            findStaffBranches: vi.fn(),
            findBranchStaff: vi.fn(),
            endStaffBranchAssignment: vi.fn(),
        };

        controller = new StaffBranchController(
            staffBranchServiceMock as unknown as StaffBranchService,
        );
    });

    describe('assignStaffToBranch', () => {
        it('should assign a staff member to a branch', async () => {
            staffBranchServiceMock.assignStaffToBranch.mockResolvedValue(
                assignment,
            );

            const result = await controller.assignStaffToBranch(
                adminRequest,
                staffId,
                assignStaffBranchDto,
            );

            expect(result).toEqual(assignment);

            expect(
                staffBranchServiceMock.assignStaffToBranch,
            ).toHaveBeenCalledWith(
                staffId,
                assignStaffBranchDto,
            );
        });

        it('should throw ForbiddenException when the user is not an administrator', async () => {
            await expect(
                controller.assignStaffToBranch(
                    customerRequest,
                    staffId,
                    assignStaffBranchDto,
                ),
            ).rejects.toThrow(ForbiddenException);

            expect(
                staffBranchServiceMock.assignStaffToBranch,
            ).not.toHaveBeenCalled();
        });

        it('should throw ForbiddenException when a staff user tries to assign a branch', async () => {
            await expect(
                controller.assignStaffToBranch(
                    staffRequest,
                    staffId,
                    assignStaffBranchDto,
                ),
            ).rejects.toThrow(ForbiddenException);

            expect(
                staffBranchServiceMock.assignStaffToBranch,
            ).not.toHaveBeenCalled();
        });
    });

    describe('findStaffBranches', () => {
        it('should return the branches assigned to a staff member', async () => {
            const assignments = [assignment];

            staffBranchServiceMock.findStaffBranches.mockResolvedValue(
                assignments,
            );

            const result = await controller.findStaffBranches(
                adminRequest,
                staffId,
            );

            expect(result).toEqual(assignments);

            expect(
                staffBranchServiceMock.findStaffBranches,
            ).toHaveBeenCalledWith(staffId);
        });

        it('should throw ForbiddenException when the user is not an administrator', async () => {
            await expect(
                controller.findStaffBranches(
                    customerRequest,
                    staffId,
                ),
            ).rejects.toThrow(ForbiddenException);

            expect(
                staffBranchServiceMock.findStaffBranches,
            ).not.toHaveBeenCalled();
        });
    });

    describe('findBranchStaff', () => {
        it('should return the staff assigned to a branch', async () => {
            const assignments = [assignment];

            staffBranchServiceMock.findBranchStaff.mockResolvedValue(
                assignments,
            );

            const result = await controller.findBranchStaff(
                adminRequest,
                branchId,
            );

            expect(result).toEqual(assignments);

            expect(
                staffBranchServiceMock.findBranchStaff,
            ).toHaveBeenCalledWith(branchId);
        });

        it('should throw ForbiddenException when the user is not an administrator', async () => {
            await expect(
                controller.findBranchStaff(
                    staffRequest,
                    branchId,
                ),
            ).rejects.toThrow(ForbiddenException);

            expect(
                staffBranchServiceMock.findBranchStaff,
            ).not.toHaveBeenCalled();
        });
    });

    describe('endStaffBranchAssignment', () => {
        it('should end a staff branch assignment', async () => {
            staffBranchServiceMock.endStaffBranchAssignment.mockResolvedValue(
                endedAssignment,
            );

            const result = await controller.endStaffBranchAssignment(
                adminRequest,
                staffId,
                assignmentId,
                endStaffBranchDto,
            );

            expect(result).toEqual(endedAssignment);

            expect(
                staffBranchServiceMock.endStaffBranchAssignment,
            ).toHaveBeenCalledWith(
                staffId,
                assignmentId,
                endStaffBranchDto,
            );
        });

        it('should throw ForbiddenException when the user is not an administrator', async () => {
            await expect(
                controller.endStaffBranchAssignment(
                    customerRequest,
                    staffId,
                    assignmentId,
                    endStaffBranchDto,
                ),
            ).rejects.toThrow(ForbiddenException);

            expect(
                staffBranchServiceMock.endStaffBranchAssignment,
            ).not.toHaveBeenCalled();
        });
    });
});