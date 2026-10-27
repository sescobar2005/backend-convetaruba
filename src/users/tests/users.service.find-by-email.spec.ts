import { beforeEach, describe, expect, it } from 'vitest';
import { createUsersServiceTestContext } from './users.service.test-utils.js';

describe('UsersService - findByEmail', () => {
    let service: ReturnType<typeof createUsersServiceTestContext>['service'];
    let prismaMock: ReturnType<typeof createUsersServiceTestContext>['prismaMock'];

    beforeEach(() => {
        ({ service, prismaMock } = createUsersServiceTestContext());
    });

    const userId = '7b8e3c2a-9f41-4d65-8a12-3e6f5c0b9a74';

    const email = 'ana.gomez@example.com';

    const existingUser = {
        idUser: userId,
        firstName: 'Ana',
        lastName: 'Gómez',
        email,
        mobileNumber: '3001234567',
        passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$examplehash',
        role: 'CUSTOMER',
        whatsappReminders: false,
        createdAt: new Date('2026-01-15T14:30:00.000Z'),
        updatedAt: new Date('2026-01-20T09:15:00.000Z'),
    };

    it('should return the user when the email exists', async () => {
        prismaMock.client.user.findUnique.mockResolvedValue(existingUser);

        const result = await service.findByEmail(email);

        expect(result).toEqual(existingUser);

        expect(prismaMock.client.user.findUnique).toHaveBeenCalledOnce();
        expect(prismaMock.client.user.findUnique).toHaveBeenCalledWith({
            where: { email },
        });
    });

    it('should return null when the email does not exist', async () => {
        prismaMock.client.user.findUnique.mockResolvedValue(null);

        const result = await service.findByEmail('unknown@example.com');

        expect(result).toBeNull();

        expect(prismaMock.client.user.findUnique).toHaveBeenCalledOnce();
        expect(prismaMock.client.user.findUnique).toHaveBeenCalledWith({
            where: { email: 'unknown@example.com' },
        });
    });

    it('should propagate a database error', async () => {
        const databaseError = new Error('Database unavailable');

        prismaMock.client.user.findUnique.mockRejectedValue(databaseError);

        await expect(service.findByEmail(email)).rejects.toBe(databaseError);

        expect(prismaMock.client.user.findUnique).toHaveBeenCalledWith({
            where: { email },
        });
    });

});