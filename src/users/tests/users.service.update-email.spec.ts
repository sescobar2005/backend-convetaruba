import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { createUsersServiceTestContext } from './users.service.test-utils.js';

describe('UsersService - updateEmail', () => {

    let service: ReturnType<typeof createUsersServiceTestContext>['service'];
    let prismaMock: ReturnType<typeof createUsersServiceTestContext>['prismaMock'];

    beforeEach(() => {
        ({ service, prismaMock } = createUsersServiceTestContext());
    });

    const idUser = 'user-123';
    const email = 'ana.nueva@example.com';

    const updatedUser = {
        idUser,
        firstName: 'Ana',
        lastName: 'Gomez',
        email,
        mobileNumber: '3001234567',
        role: 'CUSTOMER',
        updatedAt: new Date('2026-01-03T10:00:00Z'),
    };

    it('should update the email successfully', async () => {
        prismaMock.client.user.findUnique
        .mockResolvedValueOnce({ idUser })
        .mockResolvedValueOnce(null);

        prismaMock.client.user.update.mockResolvedValue(updatedUser);

        const result = await service.updateEmail(idUser, { email });

        expect(result).toEqual(updatedUser);

        expect(prismaMock.client.user.update).toHaveBeenCalledWith(
            expect.objectContaining({
            where: { idUser },
            data: { email }
            }),
        );
    });

    it('should throw NotFoundException when the user does not exist', async () => {
        prismaMock.client.user.findUnique.mockResolvedValue(null);

        await expect(
        service.updateEmail(idUser, { email }),
        ).rejects.toThrow(NotFoundException);

        expect(prismaMock.client.user.update).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when another user owns the email', async () => {
        prismaMock.client.user.findUnique
        .mockResolvedValueOnce({ idUser })
        .mockResolvedValueOnce({ idUser: 'another-user' });

        await expect(
        service.updateEmail(idUser, { email }),
        ).rejects.toThrow(ConflictException);

        expect(prismaMock.client.user.update).not.toHaveBeenCalled();
    });

    it('should allow keeping the same email for the current user', async () => {
        prismaMock.client.user.findUnique
        .mockResolvedValueOnce({ idUser })
        .mockResolvedValueOnce({ idUser });

        prismaMock.client.user.update.mockResolvedValue(updatedUser);

        const result = await service.updateEmail(idUser, { email });

        expect(result).toEqual(updatedUser);
        expect(prismaMock.client.user.update).toHaveBeenCalled();
    });

});