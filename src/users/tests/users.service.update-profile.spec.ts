import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { createUsersServiceTestContext } from './users.service.test-utils.js';

describe('UsersService - updateProfile', () => {

    let service: ReturnType<typeof createUsersServiceTestContext>['service'];
    let prismaMock: ReturnType<typeof createUsersServiceTestContext>['prismaMock'];

    beforeEach(() => {
        ({ service, prismaMock } = createUsersServiceTestContext());
    });

    const idUser = 'user-123';

    const updatedUser = {
        idUser,
        firstName: 'Ana Maria',
        lastName: 'Gomez',
        email: 'ana@example.com',
        mobileNumber: '3001234567',
        role: 'CUSTOMER',
        whatsappReminders: false,
        updatedAt: new Date('2026-01-03T10:00:00Z'),
    };

    it('should update the profile successfully', async () => {
        prismaMock.client.user.findUnique.mockResolvedValue({
        idUser
        });

        prismaMock.client.user.update.mockResolvedValue(updatedUser);

        const updateUserDto = {
        firstName: 'Ana Maria',
        lastName: 'Gomez',
        mobileNumber: '3001234567',
        whatsappReminders: false,
        };

        const result = await service.updateProfile(idUser, updateUserDto);

        expect(result).toEqual(updatedUser);

        expect(prismaMock.client.user.update).toHaveBeenCalledWith({
        where: { idUser },
        data: {
            firstName: 'Ana Maria',
            lastName: 'Gomez',
            mobileNumber: '3001234567',
            whatsappReminders: false
        },
        select: {
            idUser: true,
            firstName: true,
            lastName: true,
            email: true,
            mobileNumber: true,
            role: true,
            whatsappReminders: true,
            updatedAt: true
        },
        });
    });

    it('should throw NotFoundException when the user does not exist', async () => {
        prismaMock.client.user.findUnique.mockResolvedValue(null);

        await expect(
        service.updateProfile(idUser, { firstName: 'Ana Maria' })
        ).rejects.toThrow(NotFoundException);

        expect(prismaMock.client.user.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when no fields are provided', async () => {
        prismaMock.client.user.findUnique.mockResolvedValue({ idUser });

        await expect(service.updateProfile(idUser, {})).rejects.toThrow(BadRequestException);

        expect(prismaMock.client.user.update).not.toHaveBeenCalled();
    });

    it('should update only the fields provided', async () => {
        prismaMock.client.user.findUnique.mockResolvedValue({
        idUser
        });

        prismaMock.client.user.update.mockResolvedValue({
        ...updatedUser,
        firstName: 'Ana Maria'
        });

        await service.updateProfile(idUser, {
        firstName: 'Ana Maria'
        });

        expect(prismaMock.client.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
            where: { idUser },
            data: {
            firstName: 'Ana Maria'
            },
        }),
        );

        const updateCall =
        prismaMock.client.user.update.mock.calls[0][0];

        expect(updateCall.data).toEqual({
        firstName: 'Ana Maria'
        });
    });
    
});