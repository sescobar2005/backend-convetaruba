import { UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

describe('AuthController', () => {
    let controller: AuthController;

    const authServiceMock = {
        login: vi.fn(),
        getMe: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();

        controller = new AuthController(
            authServiceMock as unknown as AuthService,
        );
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should call AuthService.login with the provided credentials', async () => {
        const loginDto = {
            email: 'cliente@convetaruba.com',
            password: 'Password123*',
        };

        const expectedResponse = {
            accessToken: 'fake-access-token',
            expiresIn: '1h',
            user: {
                idUser: 'user-uuid-123',
                firstName: 'Carlos',
                lastName: 'Pérez',
                email: 'cliente@convetaruba.com',
                role: 'CUSTOMER',
            },
        };

        authServiceMock.login.mockResolvedValue(expectedResponse);

        const result = await controller.login(loginDto);

        expect(authServiceMock.login).toHaveBeenCalledOnce();
        expect(authServiceMock.login).toHaveBeenCalledWith(loginDto);
        expect(result).toEqual(expectedResponse);
    });

    it('should propagate errors thrown by AuthService.login', async () => {
        const loginDto = {
            email: 'cliente@convetaruba.com',
            password: 'wrong-password',
        };

        const error = new Error('Authentication failed');

        authServiceMock.login.mockRejectedValue(error);

        await expect(
            controller.login(loginDto),
        ).rejects.toThrow('Authentication failed');
    });

    it('should return the authenticated user profile', async () => {
        const authenticatedUser = {
            sub: 'user-uuid-123',
            role: 'CUSTOMER' as const,
            tokenVersion: 0,
        };

        const expectedUser = {
            idUser: 'user-uuid-123',
            firstName: 'Carlos',
            lastName: 'Pérez',
            email: 'cliente@convetaruba.com',
            role: 'CUSTOMER',
        };

        authServiceMock.getMe.mockResolvedValue(expectedUser);

        const result = await controller.getMe({
            user: authenticatedUser,
        } as never);

        expect(result).toEqual(expectedUser);
        expect(authServiceMock.getMe).toHaveBeenCalledOnce();
        expect(authServiceMock.getMe).toHaveBeenCalledWith(
            authenticatedUser.sub,
        );
    });

    it('should throw UnauthorizedException when the user identity is missing', () => {
      expect(() => controller.getMe({} as never)).toThrow(
          UnauthorizedException,
      );

      expect(authServiceMock.getMe).not.toHaveBeenCalled();
  });
});