import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

describe('AuthController', () => {
  let controller: AuthController;

  const authServiceMock = {
    login: vi.fn()
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
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
      tokenType: 'Bearer',
      expiresIn: '1h',
      user: {
          idUser: 'user-uuid-123',
          firstName: 'Carlos',
          lastName: 'Pérez',
          email: 'cliente@convetaruba.com',
          role: 'CUSTOMER'
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
      password: 'wrong-password'
    };

    const error = new Error('Authentication failed');

    authServiceMock.login.mockRejectedValue(error);

    await expect(controller.login(loginDto)).rejects.toThrow('Authentication failed');
  });
  
});