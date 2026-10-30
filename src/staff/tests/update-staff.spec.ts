
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

import { StaffPosition } from '../../../generated/prisma/client.js';

import type { UpdateStaffDto } from '../dto/update-staff.dto.js';

import { createStaffServiceTestContext } from './staff.service.test-utils.js';

describe('StaffService - update', () => {
    let service: ReturnType<
        typeof createStaffServiceTestContext
    >['service'];

    let prismaMock: ReturnType<
        typeof createStaffServiceTestContext
    >['prismaMock'];

    const staffId = '660e8400-e29b-41d4-a716-446655440000';
    const userId = '550e8400-e29b-41d4-a716-446655440000';

    const existingStaff = {
        idStaff: staffId,
    };

    const baseStaff = {
        idStaff: staffId,
        userId,
        staffNumber: 'EMP-001',
        position: StaffPosition.ASSISTANT,
        specialty: null,
        isActive: true,
        createdAt: new Date('2026-01-15T10:00:00.000Z'),
        updatedAt: new Date('2026-01-15T10:00:00.000Z'),
    };

    beforeEach(() => {
        ({ service, prismaMock } = createStaffServiceTestContext());
    });

    it('should update a staff member successfully', async () => {
        const updateStaffDto: UpdateStaffDto = {
            position: StaffPosition.VETERINARIAN,
            specialty: 'Small animals',
        };

        const updatedStaff = {
            ...baseStaff,
            position: StaffPosition.VETERINARIAN,
            specialty: 'Small animals',
            updatedAt: new Date('2026-02-01T10:00:00.000Z'),
        };

        prismaMock.client.staff.findUnique.mockResolvedValue(
            existingStaff,
        );

        prismaMock.client.staff.update.mockResolvedValue(
            updatedStaff,
        );

        const result = await service.updateStaff(staffId, updateStaffDto);

        expect(result).toEqual(updatedStaff);

        expect(prismaMock.client.staff.findUnique).toHaveBeenCalledWith({
            where: {
                idStaff: staffId,
            },
            select: {
                idStaff: true,
            },
        });

        expect(prismaMock.client.staff.update).toHaveBeenCalledWith({
            where: {
                idStaff: staffId,
            },
            data: updateStaffDto,
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

    it('should update the staff number successfully', async () => {
        const updateStaffDto: UpdateStaffDto = {
            staffNumber: 'EMP-002',
        };

        const updatedStaff = {
            ...baseStaff,
            staffNumber: 'EMP-002',
            updatedAt: new Date('2026-02-01T10:00:00.000Z'),
        };

        prismaMock.client.staff.findUnique.mockResolvedValue(
            existingStaff,
        );

        prismaMock.client.staff.update.mockResolvedValue(
            updatedStaff,
        );

        const result = await service.updateStaff(staffId, updateStaffDto);

        expect(result).toEqual(updatedStaff);

        expect(prismaMock.client.staff.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    idStaff: staffId,
                },
                data: {
                    staffNumber: 'EMP-002',
                },
            }),
        );
    });

    it('should throw NotFoundException when the staff member does not exist', async () => {
        prismaMock.client.staff.findUnique.mockResolvedValue(null);

        await expect(
            service.updateStaff(staffId, {
                position: StaffPosition.ASSISTANT,
            }),
        ).rejects.toThrow(NotFoundException);

        expect(prismaMock.client.staff.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when no fields are provided', async () => {
        prismaMock.client.staff.findUnique.mockResolvedValue(
            existingStaff,
        );

        await expect(
            service.updateStaff(staffId, {}),
        ).rejects.toThrow(BadRequestException);

        expect(prismaMock.client.staff.update).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when the staff number already exists', async () => {
        prismaMock.client.staff.findUnique.mockResolvedValue(
            existingStaff,
        );

        prismaMock.client.staff.update.mockRejectedValue(
            Object.assign(new Error('Unique constraint failed'), {
                code: 'P2002',
            }),
        );

        await expect(
            service.updateStaff(staffId, {
                staffNumber: 'EMP-002',
            }),
        ).rejects.toThrow(ConflictException);
    });

    it('should propagate unexpected database errors', async () => {
        const databaseError = new Error('Database connection failed');

        prismaMock.client.staff.findUnique.mockResolvedValue(
            existingStaff,
        );

        prismaMock.client.staff.update.mockRejectedValue(databaseError);

        await expect(
            service.updateStaff(staffId, {
                position: StaffPosition.VETERINARIAN,
            }),
        ).rejects.toThrow(databaseError);
    });
});