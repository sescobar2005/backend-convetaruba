import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard.js';

describe('UsersController', () => {
    let controller: UsersController;

    const usersServiceMock = {
        createUser: vi.fn(),
        findById: vi.fn(),
        updateProfile: vi.fn(),
        updateEmail: vi.fn(),
        changePassword: vi.fn(),
    };

    const userId = '7b8e3c2a-9f41-4d65-8a12-3e6f5c0b9a74';
    const otherUserId = '2d9a6f81-4c37-4b52-9e16-8a0f3c7d5b21';

    const customerRequest = {
        user: {
            sub: userId,
            role: 'CUSTOMER' as const,
            tokenVersion: 0,
        },
    };

    const staffRequest = {
        user: {
            sub: otherUserId,
            role: 'STAFF' as const,
            tokenVersion: 0,
        },
    };

    const adminRequest = {
        user: {
            sub: otherUserId,
            role: 'ADMIN' as const,
            tokenVersion: 0,
        },
    };

    beforeEach(async () => {
        vi.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
          controllers: [UsersController],
          providers: [
              {
                  provide: UsersService,
                  useValue: usersServiceMock,
              },
          ],
      })
          .overrideGuard(JwtAuthGuard)
          .useValue({
              canActivate: vi.fn(() => true),
          })
          .compile();

        controller = module.get<UsersController>(UsersController);
    });

    describe('create', () => {
        it('should create a user', async () => {
            const dto = {
                firstName: 'Ana',
                lastName: 'Gomez',
                email: 'ana.gomez@example.com',
                mobileNumber: '3001234567',
                password: 'SecurePassword123!',
                acceptedTermsAndPrivacyPolicy: true,
            };

            const expectedResult = {
                idUser: userId,
                firstName: 'Ana',
                lastName: 'Gomez',
                email: 'ana.gomez@example.com',
            };

            usersServiceMock.createUser.mockResolvedValue(expectedResult);

            await expect(controller.create(dto)).resolves.toEqual(
                expectedResult,
            );

            expect(usersServiceMock.createUser).toHaveBeenCalledWith(dto);
            expect(usersServiceMock.createUser).toHaveBeenCalledTimes(1);
        });

        it('should propagate service errors', async () => {
            usersServiceMock.createUser.mockRejectedValue(
                new Error('User creation failed'),
            );

            await expect(
                controller.create({
                    firstName: 'Ana',
                    lastName: 'Gomez',
                    email: 'ana.gomez@example.com',
                    mobileNumber: '3001234567',
                    password: 'SecurePassword123!',
                    acceptedTermsAndPrivacyPolicy: true,
                }),
            ).rejects.toThrow('User creation failed');
        });
    });

    describe('findById', () => {
        it('should return the own profile', async () => {
            const expectedResult = {
                idUser: userId,
                firstName: 'Ana',
                lastName: 'Gomez',
                email: 'ana.gomez@example.com',
            };

            usersServiceMock.findById.mockResolvedValue(expectedResult);

            await expect(
                controller.findById(userId, customerRequest as never),
            ).resolves.toEqual(expectedResult);

            expect(usersServiceMock.findById).toHaveBeenCalledWith(userId);
        });

        it('should allow STAFF to access another user profile', async () => {
            usersServiceMock.findById.mockResolvedValue({
                idUser: userId,
            });

            await expect(
                controller.findById(userId, staffRequest as never),
            ).resolves.toEqual({ idUser: userId });

            expect(usersServiceMock.findById).toHaveBeenCalledWith(userId);
        });

        it('should allow ADMIN to access another user profile', async () => {
            usersServiceMock.findById.mockResolvedValue({
                idUser: userId,
            });

            await expect(
                controller.findById(userId, adminRequest as never),
            ).resolves.toEqual({ idUser: userId });

            expect(usersServiceMock.findById).toHaveBeenCalledWith(userId);
        });

        it('should forbid a customer from accessing another user profile', () => {
            expect(() =>
                controller.findById(
                    otherUserId,
                    customerRequest as never,
                ),
            ).toThrow(ForbiddenException);

            expect(usersServiceMock.findById).not.toHaveBeenCalled();
        });

        it('should forbid access when the user identity is missing', () => {
            expect(() =>
                controller.findById(userId, {} as never),
            ).toThrow(
                new ForbiddenException('User identity is missing'),
            );

            expect(usersServiceMock.findById).not.toHaveBeenCalled();
        });

        it('should propagate service errors', async () => {
            usersServiceMock.findById.mockRejectedValue(
                new Error('Profile lookup failed'),
            );

            await expect(
                controller.findById(userId, customerRequest as never),
            ).rejects.toThrow('Profile lookup failed');
        });
    });

    describe('updateProfile', () => {
        it('should update the own profile', async () => {
            const dto = {
                firstName: 'Ana Maria',
                mobileNumber: '3001234567',
            };

            const expectedResult = {
                idUser: userId,
                firstName: 'Ana Maria',
                mobileNumber: '3001234567',
            };

            usersServiceMock.updateProfile.mockResolvedValue(expectedResult);

            await expect(
                controller.updateProfile(
                    userId,
                    dto,
                    customerRequest as never,
                ),
            ).resolves.toEqual(expectedResult);

            expect(usersServiceMock.updateProfile).toHaveBeenCalledWith(
                userId,
                dto,
            );
        });

        it('should forbid a customer from updating another user profile', () => {
            expect(() =>
                controller.updateProfile(
                    otherUserId,
                    { firstName: 'Unauthorized' },
                    customerRequest as never,
                ),
            ).toThrow(ForbiddenException);

            expect(usersServiceMock.updateProfile).not.toHaveBeenCalled();
        });

        it('should allow STAFF to update another user profile', async () => {
            usersServiceMock.updateProfile.mockResolvedValue({
                idUser: userId,
            });

            await expect(
                controller.updateProfile(
                    userId,
                    { firstName: 'Updated' },
                    staffRequest as never,
                ),
            ).resolves.toEqual({ idUser: userId });

            expect(usersServiceMock.updateProfile).toHaveBeenCalledWith(
                userId,
                { firstName: 'Updated' },
            );
        });

        it('should allow ADMIN to update another user profile', async () => {
            usersServiceMock.updateProfile.mockResolvedValue({
                idUser: userId,
            });

            await expect(
                controller.updateProfile(
                    userId,
                    { firstName: 'Updated' },
                    adminRequest as never,
                ),
            ).resolves.toEqual({ idUser: userId });

            expect(usersServiceMock.updateProfile).toHaveBeenCalledWith(
                userId,
                { firstName: 'Updated' },
            );
        });

        it('should propagate service errors', async () => {
            usersServiceMock.updateProfile.mockRejectedValue(
                new Error('Profile update failed'),
            );

            await expect(
                controller.updateProfile(
                    userId,
                    { firstName: 'Updated' },
                    customerRequest as never,
                ),
            ).rejects.toThrow('Profile update failed');
        });
    });

    describe('updateEmail', () => {
        it('should update the own email', async () => {
            const dto = {
                email: 'ana.gomez.new@example.com',
            };

            const expectedResult = {
                idUser: userId,
                email: 'ana.gomez.new@example.com',
            };

            usersServiceMock.updateEmail.mockResolvedValue(expectedResult);

            await expect(
                controller.updateEmail(
                    userId,
                    dto,
                    customerRequest as never,
                ),
            ).resolves.toEqual(expectedResult);

            expect(usersServiceMock.updateEmail).toHaveBeenCalledWith(
                userId,
                dto,
            );
        });

        it('should forbid a customer from changing another user email', () => {
            expect(() =>
                controller.updateEmail(
                    otherUserId,
                    { email: 'other@example.com' },
                    customerRequest as never,
                ),
            ).toThrow(ForbiddenException);

            expect(usersServiceMock.updateEmail).not.toHaveBeenCalled();
        });

        it('should allow STAFF to change another user email', async () => {
            usersServiceMock.updateEmail.mockResolvedValue({
                idUser: userId,
                email: 'updated@example.com',
            });

            await expect(
                controller.updateEmail(
                    userId,
                    { email: 'updated@example.com' },
                    staffRequest as never,
                ),
            ).resolves.toEqual({
                idUser: userId,
                email: 'updated@example.com',
            });

            expect(usersServiceMock.updateEmail).toHaveBeenCalledWith(
                userId,
                { email: 'updated@example.com' },
            );
        });

        it('should allow ADMIN to change another user email', async () => {
            usersServiceMock.updateEmail.mockResolvedValue({
                idUser: userId,
                email: 'updated@example.com',
            });

            await expect(
                controller.updateEmail(
                    userId,
                    { email: 'updated@example.com' },
                    adminRequest as never,
                ),
            ).resolves.toEqual({
                idUser: userId,
                email: 'updated@example.com',
            });

            expect(usersServiceMock.updateEmail).toHaveBeenCalledWith(
                userId,
                { email: 'updated@example.com' },
            );
        });

        it('should propagate service errors', async () => {
            usersServiceMock.updateEmail.mockRejectedValue(
                new Error('Email update failed'),
            );

            await expect(
                controller.updateEmail(
                    userId,
                    { email: 'updated@example.com' },
                    customerRequest as never,
                ),
            ).rejects.toThrow('Email update failed');
        });
    });

    describe('changePassword', () => {
        it('should change the own password', async () => {
            const dto = {
                currentPassword: 'CurrentPassword123!',
                newPassword: 'NewPassword456!',
            };

            const expectedResult = {
                message: 'Password changed successfully',
            };

            usersServiceMock.changePassword.mockResolvedValue(expectedResult);

            await expect(
                controller.changePassword(
                    userId,
                    dto,
                    customerRequest as never,
                ),
            ).resolves.toEqual(expectedResult);

            expect(usersServiceMock.changePassword).toHaveBeenCalledWith(
                userId,
                dto,
            );
        });

        it('should forbid a customer from changing another user password', () => {
            expect(() =>
                controller.changePassword(
                    otherUserId,
                    {
                        currentPassword: 'CurrentPassword123!',
                        newPassword: 'NewPassword456!',
                    },
                    customerRequest as never,
                ),
            ).toThrow(
                new ForbiddenException(
                    'You can only change your own password',
                ),
            );

            expect(usersServiceMock.changePassword).not.toHaveBeenCalled();
        });

        it('should forbid password changes when the user identity is missing', () => {
            expect(() =>
                controller.changePassword(
                    userId,
                    {
                        currentPassword: 'CurrentPassword123!',
                        newPassword: 'NewPassword456!',
                    },
                    {} as never,
                ),
            ).toThrow(
                new ForbiddenException(
                    'You can only change your own password',
                ),
            );

            expect(usersServiceMock.changePassword).not.toHaveBeenCalled();
        });

        it('should propagate service errors', async () => {
            usersServiceMock.changePassword.mockRejectedValue(
                new Error('Password change failed'),
            );

            await expect(
                controller.changePassword(
                    userId,
                    {
                        currentPassword: 'CurrentPassword123!',
                        newPassword: 'NewPassword456!',
                    },
                    customerRequest as never,
                ),
            ).rejects.toThrow('Password change failed');
        });
    });

});