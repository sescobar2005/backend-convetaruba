
import { NotFoundException } from '@nestjs/common';

import {
    beforeEach,
    describe,
    expect,
    it,
} from 'vitest';

import {
    Role,
    StaffPosition,
} from '../../../../generated/prisma/client.js';

import { createStaffServiceTestContext } from './staff.service.test-utils.js';

describe('StaffService - find', () => {
    let service: ReturnType<
        typeof createStaffServiceTestContext
    >['service'];

    let prismaMock: ReturnType<
        typeof createStaffServiceTestContext
    >['prismaMock'];

    const staffId = '660e8400-e29b-41d4-a716-446655440000';
    const userId = '550e8400-e29b-41d4-a716-446655440000';

    const createdAt = new Date('2026-01-15T10:00:00.000Z');
    const updatedAt = new Date('2026-02-01T10:00:00.000Z');

    const staffMember = {
        idStaff: staffId,
        userId,
        staffNumber: 'EMP-001',
        position: StaffPosition.VETERINARIAN,
        specialty: 'Small animals',
        isActive: true,
        createdAt,
        updatedAt,
        user: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            mobileNumber: '3001234567',
            role: Role.STAFF,
        },
    };

    beforeEach(() => {
        ({ service, prismaMock } = createStaffServiceTestContext());
    });

    describe('findAll', () => {
        it('should return all staff members with their associated user data', async () => {
            const secondStaffMember = {
                idStaff: '770e8400-e29b-41d4-a716-446655440000',
                userId: '880e8400-e29b-41d4-a716-446655440000',
                staffNumber: 'EMP-002',
                position: StaffPosition.ASSISTANT,
                specialty: null,
                isActive: true,
                createdAt: new Date('2026-01-20T10:00:00.000Z'),
                updatedAt: new Date('2026-01-20T10:00:00.000Z'),
                user: {
                    firstName: 'Jane',
                    lastName: 'Doe',
                    email: 'jane.doe@example.com',
                    mobileNumber: '3007654321',
                    role: Role.ADMIN,
                },
            };

            const staffMembers = [
                secondStaffMember,
                staffMember,
            ];

            prismaMock.client.staff.findMany.mockResolvedValue(
                staffMembers,
            );

            const result = await service.findAllStaff();

            expect(result).toEqual(staffMembers);

            expect(prismaMock.client.staff.findMany).toHaveBeenCalledTimes(1);

            expect(prismaMock.client.staff.findMany).toHaveBeenCalledWith({
                orderBy: {
                    createdAt: 'desc',
                },
                select: {
                    idStaff: true,
                    userId: true,
                    staffNumber: true,
                    position: true,
                    specialty: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true,
                            mobileNumber: true,
                            role: true,
                        },
                    },
                },
            });
        });

        it('should return an empty array when no staff members exist', async () => {
            prismaMock.client.staff.findMany.mockResolvedValue([]);

            const result = await service.findAllStaff();

            expect(result).toEqual([]);

            expect(prismaMock.client.staff.findMany).toHaveBeenCalledTimes(1);
        });

        it('should propagate unexpected database errors', async () => {
            const databaseError = new Error('Database connection failed');

            prismaMock.client.staff.findMany.mockRejectedValue(
                databaseError,
            );

            await expect(
                service.findAllStaff(),
            ).rejects.toThrow(databaseError);
        });
    });

    describe('findById', () => {
        it('should return a staff member by ID with associated user data', async () => {
            prismaMock.client.staff.findUnique.mockResolvedValue(
                staffMember,
            );

            const result = await service.findStaffById(staffId);

            expect(result).toEqual(staffMember);

            expect(prismaMock.client.staff.findUnique).toHaveBeenCalledWith({
                where: {
                    idStaff: staffId,
                },
                select: {
                    idStaff: true,
                    userId: true,
                    staffNumber: true,
                    position: true,
                    specialty: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true,
                            mobileNumber: true,
                            role: true,
                        },
                    },
                },
            });
        });

        it('should throw NotFoundException when the staff member does not exist', async () => {
            prismaMock.client.staff.findUnique.mockResolvedValue(null);

            await expect(
                service.findStaffById(staffId),
            ).rejects.toThrow(NotFoundException);

            expect(prismaMock.client.staff.findUnique).toHaveBeenCalledWith({
                where: {
                    idStaff: staffId,
                },
                select: {
                    idStaff: true,
                    userId: true,
                    staffNumber: true,
                    position: true,
                    specialty: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true,
                            mobileNumber: true,
                            role: true,
                        },
                    },
                },
            });
        });

        it('should propagate unexpected database errors', async () => {
            const databaseError = new Error('Database connection failed');

            prismaMock.client.staff.findUnique.mockRejectedValue(
                databaseError,
            );

            await expect(
                service.findStaffById(staffId),
            ).rejects.toThrow(databaseError);
        });
    });
});