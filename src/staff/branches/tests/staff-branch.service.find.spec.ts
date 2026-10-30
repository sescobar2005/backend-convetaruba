import {
    NotFoundException,
} from '@nestjs/common';

import {
    beforeEach,
    describe,
    expect,
    it,
} from 'vitest';

import {
    StaffPosition,
} from '../../../../generated/prisma/client.js';

import { createStaffBranchServiceTestContext } from './staff-branch-test.utils.js';

describe('StaffBranchService - find assignments', () => {
    let service: ReturnType<
        typeof createStaffBranchServiceTestContext
    >['service'];

    let prismaMock: ReturnType<
        typeof createStaffBranchServiceTestContext
    >['prismaMock'];

    const staffId = '660e8400-e29b-41d4-a716-446655440000';
    const branchId = '550e8400-e29b-41d4-a716-446655440000';
    const userId = '770e8400-e29b-41d4-a716-446655440000';

    const activeAssignment = {
        idStaffBranch: '880e8400-e29b-41d4-a716-446655440000',
        staffId,
        branchId,
        startDate: new Date('2026-01-15T10:00:00.000Z'),
        endDate: null,
        isActive: true,
        createdAt: new Date('2026-01-15T10:00:00.000Z'),
        updatedAt: new Date('2026-01-15T10:00:00.000Z'),
    };

    const inactiveAssignment = {
        idStaffBranch: '990e8400-e29b-41d4-a716-446655440000',
        staffId,
        branchId: '440e8400-e29b-41d4-a716-446655440000',
        startDate: new Date('2025-06-01T08:00:00.000Z'),
        endDate: new Date('2025-12-31T18:00:00.000Z'),
        isActive: false,
        createdAt: new Date('2025-06-01T08:00:00.000Z'),
        updatedAt: new Date('2025-12-31T18:00:00.000Z'),
    };

    beforeEach(() => {
        ({ service, prismaMock } = createStaffBranchServiceTestContext());
    });

    describe('findStaffBranches', () => {
        it('should return all branch assignments for a staff member', async () => {
            const assignments = [
                {
                    ...activeAssignment,
                    branch: {
                        idBranch: branchId,
                        name: 'Convetaruba Medellín',
                        slug: 'convetaruba-medellin',
                        address: 'Carrera 43A # 1-50',
                        city: 'Medellín',
                        department: 'Antioquia',
                        phone: '6044441234',
                        email: 'medellin@convetaruba.com',
                        isActive: true,
                    },
                },
                {
                    ...inactiveAssignment,
                    branch: {
                        idBranch: inactiveAssignment.branchId,
                        name: 'Convetaruba Envigado',
                        slug: 'convetaruba-envigado',
                        address: 'Calle 38 Sur # 43A-20',
                        city: 'Envigado',
                        department: 'Antioquia',
                        phone: '6044445678',
                        email: 'envigado@convetaruba.com',
                        isActive: true,
                    },
                },
            ];

            prismaMock.client.staff.findUnique.mockResolvedValue({
                idStaff: staffId,
            });

            prismaMock.client.staffBranch.findMany.mockResolvedValue(
                assignments,
            );

            const result = await service.findStaffBranches(staffId);

            expect(result).toEqual(assignments);

            expect(prismaMock.client.staff.findUnique).toHaveBeenCalledWith({
                where: {
                    idStaff: staffId,
                },
                select: {
                    idStaff: true,
                },
            });

            expect(prismaMock.client.staffBranch.findMany).toHaveBeenCalledWith({
                where: {
                    staffId,
                },
                orderBy: {
                    startDate: 'desc',
                },
                include: {
                    branch: true,
                },
            });
        });

        it('should return an empty array when the staff member has no branch assignments', async () => {
            prismaMock.client.staff.findUnique.mockResolvedValue({
                idStaff: staffId,
            });

            prismaMock.client.staffBranch.findMany.mockResolvedValue([]);

            const result = await service.findStaffBranches(staffId);

            expect(result).toEqual([]);

            expect(prismaMock.client.staffBranch.findMany).toHaveBeenCalledTimes(1);
        });

        it('should throw NotFoundException when the staff member does not exist', async () => {
            prismaMock.client.staff.findUnique.mockResolvedValue(null);

            await expect(
                service.findStaffBranches(staffId),
            ).rejects.toThrow(NotFoundException);

            expect(prismaMock.client.staffBranch.findMany).not.toHaveBeenCalled();
        });

        it('should propagate unexpected database errors', async () => {
            const databaseError = new Error('Database connection failed');

            prismaMock.client.staff.findUnique.mockResolvedValue({
                idStaff: staffId,
            });

            prismaMock.client.staffBranch.findMany.mockRejectedValue(
                databaseError,
            );

            await expect(
                service.findStaffBranches(staffId),
            ).rejects.toThrow(databaseError);
        });
    });

    describe('findBranchStaff', () => {
        it('should return all staff assignments for a branch', async () => {
            const assignments = [
                {
                    ...activeAssignment,
                    staff: {
                        idStaff: staffId,
                        userId,
                        staffNumber: 'EMP-001',
                        position: StaffPosition.VETERINARIAN,
                        specialty: 'Small animals',
                        isActive: true,
                        user: {
                            idUser: userId,
                            firstName: 'Laura',
                            lastName: 'Gómez',
                            email: 'laura.gomez@convetaruba.com',
                            mobileNumber: '3001234567',
                        },
                    },
                },
                {
                    ...inactiveAssignment,
                    branchId,
                    staff: {
                        idStaff: '330e8400-e29b-41d4-a716-446655440000',
                        userId: '220e8400-e29b-41d4-a716-446655440000',
                        staffNumber: 'EMP-002',
                        position: StaffPosition.ASSISTANT,
                        specialty: null,
                        isActive: true,
                        user: {
                            idUser: '220e8400-e29b-41d4-a716-446655440000',
                            firstName: 'Carlos',
                            lastName: 'Ramírez',
                            email: 'carlos.ramirez@convetaruba.com',
                            mobileNumber: '3109876543',
                        },
                    },
                },
            ];

            prismaMock.client.branch.findUnique.mockResolvedValue({
                idBranch: branchId,
            });

            prismaMock.client.staffBranch.findMany.mockResolvedValue(
                assignments,
            );

            const result = await service.findBranchStaff(branchId);

            expect(result).toEqual(assignments);

            expect(prismaMock.client.branch.findUnique).toHaveBeenCalledWith({
                where: {
                    idBranch: branchId,
                },
                select: {
                    idBranch: true,
                },
            });

            expect(prismaMock.client.staffBranch.findMany).toHaveBeenCalledWith({
                where: { branchId },
                orderBy: {
                    startDate: 'desc',
                },
                include: {
                    staff: {
                        select: {
                            idStaff: true,
                            userId: true,
                            staffNumber: true,
                            position: true,
                            specialty: true,
                            isActive: true,
                            user: {
                                select: {
                                    idUser: true,
                                    firstName: true,
                                    lastName: true,
                                    email: true,
                                    mobileNumber: true,
                                    role: true,
                                },
                            },
                        },
                    },
                },
            });
        });

        it('should return an empty array when the branch has no staff assignments', async () => {
            prismaMock.client.branch.findUnique.mockResolvedValue({
                idBranch: branchId,
            });

            prismaMock.client.staffBranch.findMany.mockResolvedValue([]);

            const result = await service.findBranchStaff(branchId);

            expect(result).toEqual([]);

            expect(prismaMock.client.staffBranch.findMany).toHaveBeenCalledTimes(1);
        });

        it('should throw NotFoundException when the branch does not exist', async () => {
            prismaMock.client.branch.findUnique.mockResolvedValue(null);

            await expect(
                service.findBranchStaff(branchId),
            ).rejects.toThrow(NotFoundException);

            expect(prismaMock.client.staffBranch.findMany).not.toHaveBeenCalled();
        });

        it('should propagate unexpected database errors', async () => {
            const databaseError = new Error('Database connection failed');

            prismaMock.client.branch.findUnique.mockResolvedValue({
                idBranch: branchId,
            });

            prismaMock.client.staffBranch.findMany.mockRejectedValue(
                databaseError,
            );

            await expect(
                service.findBranchStaff(branchId),
            ).rejects.toThrow(databaseError);
        });
    });
});