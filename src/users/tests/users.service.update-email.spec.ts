import { beforeEach, describe, expect, it } from 'vitest';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { createUsersServiceTestContext } from './users.service.test-utils.js';

describe('UsersService - updateEmail', () => {
    let service: ReturnType<typeof createUsersServiceTestContext>['service'];
    let prismaMock: ReturnType<typeof createUsersServiceTestContext>['prismaMock'];

    beforeEach(() => {
        ({ service, prismaMock } = createUsersServiceTestContext());
    });

    const userId = '7b8e3c2a-9f41-4d65-8a12-3e6f5c0b9a74';
    const otherUserId = '2d9a6f81-4c37-4b52-9e16-8a0f3c7d5b21';

    const currentEmail = 'ana.gomez@example.com';
    const newEmail = 'ana.gomez.new@example.com';

    const updateEmailDto = {
        email: newEmail,
    };

    const publicUser = {
        idUser: userId,
        firstName: 'Ana',
        lastName: 'Gómez',
        email: newEmail,
        mobileNumber: '3001234567',
        role: 'CUSTOMER',
        updatedAt: new Date('2026-02-01T12:00:00.000Z'),
    };

    it('should update the email when the new email is available', async () => {
        prismaMock.client.user.findUnique
            .mockResolvedValueOnce({ idUser: userId, email: currentEmail })
            .mockResolvedValueOnce(null);

        prismaMock.client.user.update.mockResolvedValue(publicUser);

        const result = await service.updateEmail(userId, updateEmailDto);

        expect(result).toEqual(publicUser);

        expect(prismaMock.client.user.findUnique).toHaveBeenNthCalledWith(1, {
            where: { idUser: userId },
            select: { idUser: true },
        });

        expect(prismaMock.client.user.findUnique).toHaveBeenNthCalledWith(2, {
            where: { email: newEmail },
            select: { idUser: true },
        });

        expect(prismaMock.client.user.update).toHaveBeenCalledWith({
            where: { idUser: userId },
            data: { email: newEmail },
            select: {
                idUser: true,
                firstName: true,
                lastName: true,
                email: true,
                mobileNumber: true,
                role: true,
                updatedAt: true,
            },
        });

        expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw NotFoundException when the user does not exist', async () => {
        prismaMock.client.user.findUnique.mockResolvedValueOnce(null);

        await expect(service.updateEmail(userId, updateEmailDto))
            .rejects.toThrow(NotFoundException);

        expect(prismaMock.client.user.findUnique).toHaveBeenCalledOnce();
        expect(prismaMock.client.user.update).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when another user owns the email', async () => {
        prismaMock.client.user.findUnique
            .mockResolvedValueOnce({ idUser: userId })
            .mockResolvedValueOnce({ idUser: otherUserId });

        await expect(service.updateEmail(userId, updateEmailDto))
            .rejects.toThrow(ConflictException);

        expect(prismaMock.client.user.update).not.toHaveBeenCalled();
    });

    it('should allow the user to keep their own email', async () => {
        prismaMock.client.user.findUnique
            .mockResolvedValueOnce({ idUser: userId })
            .mockResolvedValueOnce({ idUser: userId });

        prismaMock.client.user.update.mockResolvedValue({
            ...publicUser,
            email: currentEmail,
        });

        const result = await service.updateEmail(userId, {
            email: currentEmail,
        });

        expect(result.email).toBe(currentEmail);
        expect(prismaMock.client.user.update).toHaveBeenCalledOnce();
    });

    it('should throw ConflictException when Prisma reports a unique constraint violation', async () => {
        prismaMock.client.user.findUnique
            .mockResolvedValueOnce({ idUser: userId })
            .mockResolvedValueOnce(null);

        prismaMock.client.user.update.mockRejectedValue({
            code: 'P2002',
        });

        await expect(service.updateEmail(userId, updateEmailDto))
            .rejects.toThrow(ConflictException);
    });

    it('should propagate unexpected database errors', async () => {
        prismaMock.client.user.findUnique
            .mockResolvedValueOnce({ idUser: userId })
            .mockResolvedValueOnce(null);

        const databaseError = new Error('Database unavailable');
        prismaMock.client.user.update.mockRejectedValue(databaseError);

        await expect(service.updateEmail(userId, updateEmailDto))
            .rejects.toBe(databaseError);
    });

});