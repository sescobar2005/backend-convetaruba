import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { createUsersServiceTestContext } from './users.service.test-utils.js';

describe('UsersService - changePassword', () => {

    let service: ReturnType<typeof createUsersServiceTestContext>['service'];
    let prismaMock: ReturnType<typeof createUsersServiceTestContext>['prismaMock'];

    beforeEach(() => {
        ({ service, prismaMock } = createUsersServiceTestContext());
    });

    const idUser = 'user-123';
    const currentPassword = 'OldPassword123*';
    const newPassword = 'NewPassword456*';

    it('should throw NotFoundException when the user does not exist', async () => {
        prismaMock.client.user.findUnique.mockResolvedValue(null);

        await expect(
        service.changePassword(idUser, {
            currentPassword,
            newPassword
        })
        ).rejects.toThrow(NotFoundException);

        expect(prismaMock.client.user.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when the current password is incorrect', async () => {
        const passwordHash = await argon2.hash(currentPassword);

        prismaMock.client.user.findUnique.mockResolvedValue({
        idUser,
        passwordHash
        });

        await expect(
        service.changePassword(idUser, {
            currentPassword: 'WrongPassword123*',
            newPassword
        })
        ).rejects.toThrow(BadRequestException);

        expect(prismaMock.client.user.update).not.toHaveBeenCalled();
    });

    it('should store the new password as an Argon2 hash', async () => {
        const passwordHash = await argon2.hash(currentPassword);

        prismaMock.client.user.findUnique.mockResolvedValue({
        idUser,
        passwordHash
        });

        prismaMock.client.user.update.mockResolvedValue({});

        const result = await service.changePassword(idUser, {
        currentPassword,
        newPassword
        });

        expect(result).toEqual({
        message: 'Password changed successfully'
        });

        const updateCall = prismaMock.client.user.update.mock.calls[0][0];
        const newPasswordHash = updateCall.data.passwordHash;

        expect(newPasswordHash).not.toBe(newPassword);

        expect(await argon2.verify(newPasswordHash, newPassword)).toBe(true);
    });

    it('should increment tokenVersion when the password changes', async () => {
        const passwordHash = await argon2.hash(currentPassword);

        prismaMock.client.user.findUnique.mockResolvedValue({
        idUser,
        passwordHash
        });

        prismaMock.client.user.update.mockResolvedValue({});

        await service.changePassword(idUser, {
        currentPassword,
        newPassword
        });

        expect(prismaMock.client.user.update).toHaveBeenCalledWith({
        where: { idUser },
        data: {
            passwordHash: expect.any(String),
            tokenVersion: { increment: 1 }
        },
        });
    });

});