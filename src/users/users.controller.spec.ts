import { vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard.js';
import { UsersService } from './users.service.js';

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const usersServiceMock = {
      createUser: vi.fn(),
      findById: vi.fn(),
      updateProfile: vi.fn(),
      updateEmail: vi.fn(),
      changePassword: vi.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersServiceMock
        },
      ],
    })
    .overrideGuard(JwtAuthGuard)
    .useValue({ canActivate: () => true })
    .compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
