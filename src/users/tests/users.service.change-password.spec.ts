import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { createUsersServiceTestContext } from './users.service.test-utils.js';

describe('UsersService.changePassword', () => {
    const userId = '7b8e3c2a-9f41-4d65-8a12-3e6f5c0b9a74';
    const currentPassword = 'CurrentPassword123!';
    const newPassword = 'NewPassword456!';

    let service: ReturnType<typeof createUsersServiceTestContext>['service'];
    let prismaMock: ReturnType<typeof createUsersServiceTestContext>['prismaMock'];
    let currentPasswordHash: string;

    beforeEach(async () => {
        vi.clearAllMocks();

        const context = createUsersServiceTestContext();
        service = context.service;
        prismaMock = context.prismaMock;

        currentPasswordHash = await argon2.hash(currentPassword);
    });

    it('should change the password successfully', async () => {
        prismaMock.client.user.findUnique.mockResolvedValue({
            idUser: userId,
            passwordHash: currentPasswordHash,
        });

        prismaMock.client.user.update.mockResolvedValue({
            idUser: userId,
        });

        const result = await service.changePassword(userId, {
            currentPassword,
            newPassword,
        });

        expect(prismaMock.client.user.findUnique).toHaveBeenCalledWith({
            where: { idUser: userId },
            select: {
                idUser: true,
                passwordHash: true,
            },
        });

        expect(prismaMock.client.user.update).toHaveBeenCalledTimes(1);

        const updateArguments =
            prismaMock.client.user.update.mock.calls[0][0];

        expect(updateArguments.where).toEqual({ idUser: userId });
        expect(updateArguments.data.tokenVersion).toEqual({ increment: 1 });
        expect(updateArguments.data.passwordHash).not.toBe(currentPasswordHash);

        expect(
            await argon2.verify(
                updateArguments.data.passwordHash,
                newPassword,
            ),
        ).toBe(true);

        expect(result).toEqual({
            message: 'Password changed successfully',
        });
    });

    it('should throw NotFoundException when the user does not exist', async () => {
        prismaMock.client.user.findUnique.mockResolvedValue(null);

        await expect(
            service.changePassword(userId, {
                currentPassword,
                newPassword,
            }),
        ).rejects.toThrow(NotFoundException);

        expect(prismaMock.client.user.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when the current password is incorrect', async () => {
        prismaMock.client.user.findUnique.mockResolvedValue({
            idUser: userId,
            passwordHash: currentPasswordHash,
        });

        await expect(
            service.changePassword(userId, {
                currentPassword: 'WrongPassword123!',
                newPassword,
            }),
        ).rejects.toThrow(BadRequestException);

        expect(prismaMock.client.user.update).not.toHaveBeenCalled();
    });

    it('should propagate database errors when looking up the user', async () => {
        prismaMock.client.user.findUnique.mockRejectedValue(
            new Error('Database connection failed'),
        );

        await expect(
            service.changePassword(userId, {
                currentPassword,
                newPassword,
            }),
        ).rejects.toThrow('Database connection failed');

        expect(prismaMock.client.user.update).not.toHaveBeenCalled();
    });

    it('should propagate database errors when updating the password', async () => {
        prismaMock.client.user.findUnique.mockResolvedValue({
            idUser: userId,
            passwordHash: currentPasswordHash,
        });

        prismaMock.client.user.update.mockRejectedValue(
            new Error('Password update failed'),
        );

        await expect(
            service.changePassword(userId, {
                currentPassword,
                newPassword,
            }),
        ).rejects.toThrow('Password update failed');
    });

});