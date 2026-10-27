import { beforeEach, describe, expect, it } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { createUsersServiceTestContext } from './users.service.test-utils.js';

describe('UsersService - findById', () => {
    let service: ReturnType<typeof createUsersServiceTestContext>['service'];
    let prismaMock: ReturnType<typeof createUsersServiceTestContext>['prismaMock'];

    beforeEach(() => {
        ({ service, prismaMock } = createUsersServiceTestContext());
    });

    const userId = '7b8e3c2a-9f41-4d65-8a12-3e6f5c0b9a74';

    const existingUser = {
        idUser: userId,
        firstName: 'Ana',
        lastName: 'Gómez',
        email: 'ana.gomez@example.com',
        mobileNumber: '3001234567',
        role: 'CUSTOMER',
        createdAt: new Date('2026-01-15T14:30:00.000Z'),
        updatedAt: new Date('2026-01-20T09:15:00.000Z'),
        whatsappReminders: false,
    };

    it('should return the user when the ID exists', async () => {
        prismaMock.client.user.findUnique.mockResolvedValue(existingUser);

        const result = await service.findById(userId);

        expect(result).toEqual(existingUser);

        expect(prismaMock.client.user.findUnique).toHaveBeenCalledOnce();
        expect(prismaMock.client.user.findUnique).toHaveBeenCalledWith({
            where: { idUser: userId },
            select: {
                idUser: true,
                firstName: true,
                lastName: true,
                email: true,
                mobileNumber: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                whatsappReminders: true,
            },
        });

        expect(result).not.toHaveProperty('password');
        expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw NotFoundException when the user does not exist', async () => {
        prismaMock.client.user.findUnique.mockResolvedValue(null);

        await expect(service.findById(userId))
            .rejects.toThrow(NotFoundException);

        expect(prismaMock.client.user.findUnique).toHaveBeenCalledWith({
            where: { idUser: userId },
            select: {
                idUser: true,
                firstName: true,
                lastName: true,
                email: true,
                mobileNumber: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                whatsappReminders: true,
            },
        });
    });

    it('should propagate a database error', async () => {
        const databaseError = new Error('Database unavailable');

        prismaMock.client.user.findUnique.mockRejectedValue(databaseError);

        await expect(service.findById(userId))
            .rejects.toBe(databaseError);
    });
    
});