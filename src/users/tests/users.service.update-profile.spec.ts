import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { createUsersServiceTestContext } from './users.service.test-utils.js';

describe('UsersService.updateProfile', () => {
    const userId = '7b8e3c2a-9f41-4d65-8a12-3e6f5c0b9a74';

    const existingUser = {
        idUser: userId,
    };

    const updatedUser = {
        idUser: userId,
        firstName: 'Ana',
        lastName: 'Gomez',
        email: 'ana.gomez@example.com',
        mobileNumber: '3001234567',
        role: 'CUSTOMER',
        createdAt: new Date('2026-01-01T10:00:00.000Z'),
        updatedAt: new Date('2026-01-02T10:00:00.000Z'),
        whatsappReminders: true,
    };

    let service: ReturnType<typeof createUsersServiceTestContext>['service'];
    let prismaMock: ReturnType<typeof createUsersServiceTestContext>['prismaMock'];

    beforeEach(() => {
        vi.clearAllMocks();

        const context = createUsersServiceTestContext();
        service = context.service;
        prismaMock = context.prismaMock;
    });

    it('should update the user profile successfully', async () => {
        const dto = {
            firstName: 'Ana',
            lastName: 'Gomez',
            mobileNumber: '3001234567',
            whatsappReminders: true,
        };

        prismaMock.client.user.findUnique.mockResolvedValue(existingUser);
        prismaMock.client.user.update.mockResolvedValue(updatedUser);

        const result = await service.updateProfile(userId, dto);

        expect(prismaMock.client.user.findUnique).toHaveBeenCalledWith({
            where: { idUser: userId },
            select: { idUser: true },
        });

        expect(prismaMock.client.user.update).toHaveBeenCalledWith({
            where: { idUser: userId },
            data: dto,
            select: {
                idUser: true,
                firstName: true,
                lastName: true,
                email: true,
                mobileNumber: true,
                role: true,
                updatedAt: true,
                whatsappReminders: true,
            },
        });

        expect(result).toEqual(updatedUser);
        expect(result).not.toHaveProperty('passwordHash');
        expect(result).not.toHaveProperty('password');
    });

    it('should throw NotFoundException when the user does not exist', async () => {
        prismaMock.client.user.findUnique.mockResolvedValue(null);

        await expect(
            service.updateProfile(userId, { firstName: 'Ana' }),
        ).rejects.toThrow(NotFoundException);

        expect(prismaMock.client.user.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when no profile fields are provided', async () => {
        prismaMock.client.user.findUnique.mockResolvedValue(existingUser);

        await expect(
            service.updateProfile(userId, {}),
        ).rejects.toThrow(
            new BadRequestException(
                'At least one profile field must be provided',
            ),
        );

        expect(prismaMock.client.user.update).not.toHaveBeenCalled();
    });

    it('should update only the fields provided in the DTO', async () => {
        const dto = {
            firstName: 'Ana Maria',
        };

        prismaMock.client.user.findUnique.mockResolvedValue(existingUser);
        prismaMock.client.user.update.mockResolvedValue({
            ...updatedUser,
            firstName: 'Ana Maria',
        });

        await service.updateProfile(userId, dto);

        expect(prismaMock.client.user.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { idUser: userId },
                data: dto,
            }),
        );
    });

    it('should propagate database errors when looking up the user', async () => {
        const databaseError = new Error('Database connection failed');

        prismaMock.client.user.findUnique.mockRejectedValue(databaseError);

        await expect(
            service.updateProfile(userId, { firstName: 'Ana' }),
        ).rejects.toThrow('Database connection failed');

        expect(prismaMock.client.user.update).not.toHaveBeenCalled();
    });

    it('should propagate database errors when updating the profile', async () => {
        const databaseError = new Error('Update failed');

        prismaMock.client.user.findUnique.mockResolvedValue(existingUser);
        prismaMock.client.user.update.mockRejectedValue(databaseError);

        await expect(
            service.updateProfile(userId, { firstName: 'Ana' }),
        ).rejects.toThrow('Update failed');
    });

});