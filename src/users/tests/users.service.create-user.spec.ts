import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConflictException } from '@nestjs/common';
import * as argon2 from 'argon2';  
import { createUsersServiceTestContext } from './users.service.test-utils.js';
  
describe('UsersService - createUser', () => {

    let service: ReturnType<typeof createUsersServiceTestContext>['service'];
    let prismaMock: ReturnType<typeof createUsersServiceTestContext>['prismaMock'];

    beforeEach(() => {
        ({ service, prismaMock } = createUsersServiceTestContext());
    });

    const createUserDto = {
        firstName: 'Ana',
        lastName: 'Gomez',
        email: 'ana@example.com',
        mobileNumber: '3001234567',
        password: 'SecurePass123!',
        acceptedTermsAndPrivacyPolicy: true,
        whatsappReminders: false
    };

    it('should throw ConflictException when the email already exists', async () => {
        prismaMock.client.user.findUnique.mockResolvedValue({
        idUser: 'existing-user',
        email: createUserDto.email
        });

        await expect(service.createUser(createUserDto)).rejects.toThrow(ConflictException);

        expect(prismaMock.client.user.create).not.toHaveBeenCalled();
    });

    it('should create a user with the CUSTOMER role', async () => {
        prismaMock.client.user.findUnique.mockResolvedValue(null);

        const createdUser = {
        idUser: 'user-123',
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        email: createUserDto.email,
        mobileNumber: createUserDto.mobileNumber,
        role: 'CUSTOMER',
        createdAt: new Date('2026-01-01T10:00:00Z'),
        };

        prismaMock.client.user.create.mockResolvedValue(createdUser);

        const result = await service.createUser(createUserDto);

        expect(result).toEqual(createdUser);

        expect(prismaMock.client.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
            data: expect.objectContaining({
            firstName: createUserDto.firstName,
            lastName: createUserDto.lastName,
            email: createUserDto.email,
            mobileNumber: createUserDto.mobileNumber,
            role: 'CUSTOMER'
            }),
            select: expect.objectContaining({
            idUser: true,
            email: true,
            role: true
            }),
        }),
        );
    });

    it('should store the password as an Argon2 hash', async () => {
        prismaMock.client.user.findUnique.mockResolvedValue(null);

        prismaMock.client.user.create.mockImplementation(
        async (args: any) => ({
            idUser: 'user-123',
            firstName: args.data.firstName,
            lastName: args.data.lastName,
            email: args.data.email,
            mobileNumber: args.data.mobileNumber,
            role: args.data.role,
            createdAt: new Date()
        }),
        );

        await service.createUser(createUserDto);

        const createCall = prismaMock.client.user.create.mock.calls[0];
        const savedPasswordHash = createCall[0].data.passwordHash;

        expect(savedPasswordHash).not.toBe(createUserDto.password);
        expect(
        await argon2.verify(savedPasswordHash, createUserDto.password)
        ).toBe(true);
    });
    
});