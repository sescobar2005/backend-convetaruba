import { vi } from 'vitest';
import { AuthService } from '../auth.service.js';
import { UsersService } from '../../users/users.service.js';
import { JwtService } from '@nestjs/jwt';

export function createAuthServiceTestContext(){
    const usersServiceMock = {
        findByEmail: vi.fn()
    };

    const jwtServiceMock = {
        signAsync: vi.fn()
    }

    const service = new AuthService(
        usersServiceMock as unknown as UsersService,
        jwtServiceMock as unknown as JwtService
    );

    return {
        service,
        usersServiceMock,
        jwtServiceMock
    };
}