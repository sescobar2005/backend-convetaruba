
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

import {
    Role,
    StaffPosition,
} from '../../../../generated/prisma/client.js';

import type { CreateStaffDto } from '../dto/create-staff.dto.js';

import { createStaffServiceTestContext } from './staff.service.test-utils.js';

describe('StaffService - create', () => {
    let service: ReturnType<
        typeof createStaffServiceTestContext
    >['service'];

    let prismaMock: ReturnType<
        typeof createStaffServiceTestContext
    >['prismaMock'];

    const userId = '550e8400-e29b-41d4-a716-446655440000';
    const staffId = '660e8400-e29b-41d4-a716-446655440000';

    const createStaffDto: CreateStaffDto = {
        userId,
        staffNumber: 'EMP-001',
        position: StaffPosition.VETERINARIAN,
        specialty: 'Small animals',
    };

    const staffUser = {
        idUser: userId,
        role: Role.STAFF,
        staff: null,
    };

    const createdStaff = {
        idStaff: staffId,
        userId,
        staffNumber: 'EMP-001',
        position: StaffPosition.VETERINARIAN,
        specialty: 'Small animals',
        isActive: true,
        createdAt: new Date('2026-01-15T10:00:00.000Z'),
        updatedAt: new Date('2026-01-15T10:00:00.000Z'),
    };

    beforeEach(() => {
        ({ service, prismaMock } = createStaffServiceTestContext());
    });

    it('should create a staff member successfully', async () => {
        prismaMock.client.user.findUnique.mockResolvedValue(staffUser);

        prismaMock.client.staff.create.mockResolvedValue(createdStaff);

        const result = await service.createStaff(createStaffDto);

        expect(result).toEqual(createdStaff);

        expect(prismaMock.client.user.findUnique).toHaveBeenCalledWith({
            where: {
                idUser: userId,
            },
            select: {
                idUser: true,
                role: true,
                staff: {
                    select: {
                        idStaff: true,
                    },
                },
            },
        });

        expect(prismaMock.client.staff.create).toHaveBeenCalledWith({
            data: {
                userId,
                staffNumber: 'EMP-001',
                position: StaffPosition.VETERINARIAN,
                specialty: 'Small animals',
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
            },
        });
    });

    it('should allow creating a staff record for an ADMIN user', async () => {
        prismaMock.client.user.findUnique.mockResolvedValue({
            ...staffUser,
            role: Role.ADMIN,
        });

        prismaMock.client.staff.create.mockResolvedValue(createdStaff);

        const result = await service.createStaff(createStaffDto);

        expect(result).toEqual(createdStaff);

        expect(prismaMock.client.staff.create).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when the user does not exist', async () => {
        prismaMock.client.user.findUnique.mockResolvedValue(null);

        await expect(
            service.createStaff(createStaffDto),
        ).rejects.toThrow(NotFoundException);

        expect(prismaMock.client.staff.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when the user has CUSTOMER role', async () => {
        prismaMock.client.user.findUnique.mockResolvedValue({
            ...staffUser,
            role: Role.CUSTOMER,
        });

        await expect(
            service.createStaff(createStaffDto),
        ).rejects.toThrow(BadRequestException);

        expect(prismaMock.client.staff.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when the user already has a staff record', async () => {
        prismaMock.client.user.findUnique.mockResolvedValue({
            ...staffUser,
            staff: {
                idStaff: '770e8400-e29b-41d4-a716-446655440000',
            },
        });

        await expect(
            service.createStaff(createStaffDto),
        ).rejects.toThrow(ConflictException);

        expect(prismaMock.client.staff.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when the staff number already exists', async () => {
        prismaMock.client.user.findUnique.mockResolvedValue(staffUser);

        prismaMock.client.staff.create.mockRejectedValue(
            Object.assign(new Error('Unique constraint failed'), {
                code: 'P2002',
            }),
        );

        await expect(
            service.createStaff(createStaffDto),
        ).rejects.toThrow(ConflictException);
    });

    it('should propagate unexpected database errors', async () => {
        const databaseError = new Error('Database connection failed');

        prismaMock.client.user.findUnique.mockResolvedValue(staffUser);

        prismaMock.client.staff.create.mockRejectedValue(databaseError);

        await expect(
            service.createStaff(createStaffDto),
        ).rejects.toThrow(databaseError);
    });
});