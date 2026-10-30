
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

import type { UpdateStaffStatusDto } from '../dto/update-staff-status.dto.js';

import { createStaffServiceTestContext } from './staff.service.test-utils.js';

describe('StaffService - updateStatus', () => {
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
        position: StaffPosition.VETERINARIAN,
        specialty: 'Small animals',
        isActive: true,
        createdAt: new Date('2026-01-15T10:00:00.000Z'),
        updatedAt: new Date('2026-01-15T10:00:00.000Z'),
    };

    beforeEach(() => {
        ({ service, prismaMock } = createStaffServiceTestContext());
    });

    it('should deactivate a staff member successfully', async () => {
        const updateStaffStatusDto: UpdateStaffStatusDto = {
            isActive: false,
        };

        const updatedStaff = {
            ...baseStaff,
            isActive: false,
            updatedAt: new Date('2026-02-01T10:00:00.000Z'),
        };

        prismaMock.client.staff.findUnique.mockResolvedValue(
            existingStaff,
        );

        prismaMock.client.staff.update.mockResolvedValue(
            updatedStaff,
        );

        const result = await service.updateStaffStatus(
            staffId,
            updateStaffStatusDto,
        );

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
            data: {
                isActive: false,
            },
            select: {
                idStaff: true,
                userId: true,
                staffNumber: true,
                position: true,
                specialty: true,
                isActive: true,
                updatedAt: true,
            },
        });
    });

    it('should activate a staff member successfully', async () => {
        const updateStaffStatusDto: UpdateStaffStatusDto = {
            isActive: true,
        };

        const inactiveStaff = {
            ...baseStaff,
            isActive: false,
        };

        const activatedStaff = {
            ...baseStaff,
            isActive: true,
            updatedAt: new Date('2026-02-01T10:00:00.000Z'),
        };

        prismaMock.client.staff.findUnique.mockResolvedValue(
            existingStaff,
        );

        prismaMock.client.staff.update.mockResolvedValue(
            activatedStaff,
        );

        const result = await service.updateStaffStatus(
            staffId,
            updateStaffStatusDto,
        );

        expect(inactiveStaff.isActive).toBe(false);
        expect(result).toEqual(activatedStaff);

        expect(prismaMock.client.staff.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    idStaff: staffId,
                },
                data: {
                    isActive: true,
                },
            }),
        );
    });

    it('should throw NotFoundException when the staff member does not exist', async () => {
        prismaMock.client.staff.findUnique.mockResolvedValue(null);

        await expect(
            service.updateStaffStatus(staffId, {
                isActive: false,
            }),
        ).rejects.toThrow(NotFoundException);

        expect(prismaMock.client.staff.update).not.toHaveBeenCalled();
    });

    it('should propagate unexpected database errors when finding the staff member', async () => {
        const databaseError = new Error('Database connection failed');

        prismaMock.client.staff.findUnique.mockRejectedValue(
            databaseError,
        );

        await expect(
            service.updateStaffStatus(staffId, {
                isActive: false,
            }),
        ).rejects.toThrow(databaseError);

        expect(prismaMock.client.staff.update).not.toHaveBeenCalled();
    });

    it('should propagate unexpected database errors when updating the staff status', async () => {
        const databaseError = new Error('Database connection failed');

        prismaMock.client.staff.findUnique.mockResolvedValue(
            existingStaff,
        );

        prismaMock.client.staff.update.mockRejectedValue(
            databaseError,
        );

        await expect(
            service.updateStaffStatus(staffId, {
                isActive: false,
            }),
        ).rejects.toThrow(databaseError);
    });
});