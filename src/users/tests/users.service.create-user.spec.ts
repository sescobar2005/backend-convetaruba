import { beforeEach, describe, expect, it } from 'vitest';
import { ConflictException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { createUsersServiceTestContext } from './users.service.test-utils.js';

describe('UsersService - createUser', () => {
    let service: ReturnType<typeof createUsersServiceTestContext>['service'];
    let prismaMock: ReturnType<typeof createUsersServiceTestContext>['prismaMock'];

    beforeEach(() => {
        ({ service, prismaMock } = createUsersServiceTestContext());
    });

    const existingUserId = '7b8e3c2a-9f41-4d65-8a12-3e6f5c0b9a74';
    const createdUserId = '2d9a6f81-4c37-4b52-9e16-8a0f3c7d5b21';

    const createUserDto = {
        firstName: 'Ana',
        lastName: 'Gómez',
        email: 'ana.gomez@example.com',
        mobileNumber: '3001234567',
        password: 'SecurePass123!',
        acceptedTermsAndPrivacyPolicy: true,
        whatsappReminders: false,
    };

    it('should throw ConflictException when the email already exists', async () => {
        prismaMock.client.user.findUnique.mockResolvedValue({
            idUser: existingUserId,
            email: createUserDto.email,
        });

        await expect(service.createUser(createUserDto))
            .rejects.toThrow(ConflictException);

        expect(prismaMock.client.user.findUnique).toHaveBeenCalledWith({
            where: { email: createUserDto.email },
        });

        expect(prismaMock.client.user.create).not.toHaveBeenCalled();
    });

    it('should create a user with the CUSTOMER role and return public fields', async () => {
        prismaMock.client.user.findUnique.mockResolvedValue(null);

        const createdAt = new Date('2026-01-15T14:30:00.000Z');

        const createdUser = {
            idUser: createdUserId,
            firstName: createUserDto.firstName,
            lastName: createUserDto.lastName,
            email: createUserDto.email,
            mobileNumber: createUserDto.mobileNumber,
            role: 'CUSTOMER',
            createdAt,
        };

        prismaMock.client.user.create.mockResolvedValue(createdUser);

        const result = await service.createUser(createUserDto);

        expect(result).toEqual(createdUser);
        expect(result.idUser).toBe(createdUserId);
        expect(result).not.toHaveProperty('password');
        expect(result).not.toHaveProperty('passwordHash');

        expect(prismaMock.client.user.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    firstName: createUserDto.firstName,
                    lastName: createUserDto.lastName,
                    email: createUserDto.email,
                    mobileNumber: createUserDto.mobileNumber,
                    role: 'CUSTOMER',
                }),
                select: {
                    idUser: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    mobileNumber: true,
                    role: true,
                    createdAt: true,
                },
            }),
        );
    });

    it('should store the password as a valid Argon2 hash', async () => {
        prismaMock.client.user.findUnique.mockResolvedValue(null);

        prismaMock.client.user.create.mockImplementation(async (args: any) => ({
            idUser: createdUserId,
            firstName: args.data.firstName,
            lastName: args.data.lastName,
            email: args.data.email,
            mobileNumber: args.data.mobileNumber,
            role: args.data.role,
            createdAt: new Date('2026-01-15T14:30:00.000Z'),
        }));

        await service.createUser(createUserDto);

        const createCall = prismaMock.client.user.create.mock.calls[0];
        const savedPasswordHash = createCall[0].data.passwordHash;

        expect(savedPasswordHash).not.toBe(createUserDto.password);

        await expect(
            argon2.verify(savedPasswordHash, createUserDto.password),
        ).resolves.toBe(true);
    });

    it('should save the required legal acceptance information', async () => {
        prismaMock.client.user.findUnique.mockResolvedValue(null);
        prismaMock.client.user.create.mockResolvedValue({
            idUser: createdUserId,
        });

        await service.createUser(createUserDto);

        const createCall = prismaMock.client.user.create.mock.calls[0];
        const savedData = createCall[0].data;

        expect(savedData.termsVersion).toBe('1.0');
        expect(savedData.privacyPolicyVersion).toBe('1.0');
        expect(savedData.termsAcceptedAt).toBeInstanceOf(Date);
        expect(savedData.privacyPolicyAcceptedAt).toBeInstanceOf(Date);
    });

    it('should disable WhatsApp reminders when the preference is omitted', async () => {
        prismaMock.client.user.findUnique.mockResolvedValue(null);
        prismaMock.client.user.create.mockResolvedValue({
            idUser: createdUserId,
        });

        const { whatsappReminders: _omitted, ...dtoWithoutPreference } =
            createUserDto;

        await service.createUser(dtoWithoutPreference);

        expect(prismaMock.client.user.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    whatsappReminders: false,
                }),
            }),
        );
    });

    it('should propagate a database error when user creation fails', async () => {
        prismaMock.client.user.findUnique.mockResolvedValue(null);

        const databaseError = new Error('Database unavailable');
        prismaMock.client.user.create.mockRejectedValue(databaseError);

        await expect(service.createUser(createUserDto))
            .rejects.toBe(databaseError);
    });

});