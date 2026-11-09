import * as argon2 from 'argon2';
import { createAuthServiceTestContext } from './auth.service.test-utils.js';
import { UnauthorizedException } from '@nestjs/common';

vi.mock('argon2', () => ({
    verify: vi.fn()
}));

describe('AuthService - login', () => {
    const {
        service,
        usersServiceMock,
        jwtServiceMock
    } = createAuthServiceTestContext();

    const loginDto = {
        email: 'cliente@convetaruba.com',
        password: 'Password123*'
    };

    const userMock = {
        idUser: 'user-uuid-123',
        firstName: 'Carlos',
        lastName: 'Pérez',
        email: 'cliente@convetaruba.com',
        passwordHash: 'hashed-password',
        role: 'CUSTOMER',
        tokenVersion: 0
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should log in successfully and return the access token and public user data', async () => {
        usersServiceMock.findByEmail.mockResolvedValue(userMock);
        vi.mocked(argon2.verify).mockResolvedValue(true);
        jwtServiceMock.signAsync.mockResolvedValue('fake-access-token');

        const result = await service.login(loginDto);

        expect(result).toEqual({
            accessToken: 'fake-access-token',
            expiresIn: '1h',
            user: {
                idUser: userMock.idUser,
                firstName: userMock.firstName,
                lastName: userMock.lastName,
                email: userMock.email,
                role: userMock.role
            }
        });

        expect(usersServiceMock.findByEmail).toHaveBeenCalledWith(loginDto.email);
        expect(argon2.verify).toHaveBeenCalledWith(userMock.passwordHash, loginDto.password);
        expect(jwtServiceMock.signAsync).toHaveBeenCalledWith({
            sub: userMock.idUser,
            role: userMock.role,
            tokenVersion: userMock.tokenVersion
        });

        expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should throw UnauthorizedException when the email does not exist', async () => {
        usersServiceMock.findByEmail.mockResolvedValue(null);

        await expect(service.login(loginDto)).rejects.toThrow(
            new UnauthorizedException('Invalid email or password')
        );

        expect(argon2.verify).not.toHaveBeenCalled();
        expect(jwtServiceMock.signAsync).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when the password is incorrect', async () => {
        usersServiceMock.findByEmail.mockResolvedValue(userMock);
        vi.mocked(argon2.verify).mockResolvedValue(false);

        await expect(service.login(loginDto)).rejects.toThrow(
            new UnauthorizedException('Invalid email or password')
        );

        expect(jwtServiceMock.signAsync).not.toHaveBeenCalled();
    });

    it('should include tokenVersion in the JWT payload', async () => {
        const userWithUpdatedTokenVersion = {
            ...userMock,
            tokenVersion: 3
        };

        usersServiceMock.findByEmail.mockResolvedValue(
            userWithUpdatedTokenVersion
        );

        vi.mocked(argon2.verify).mockResolvedValue(true);
        jwtServiceMock.signAsync.mockResolvedValue('fake-access-token');

        await service.login(loginDto);

        expect(jwtServiceMock.signAsync).toHaveBeenCalledWith({
            sub: userMock.idUser,
            role: userMock.role,
            tokenVersion: 3
        });
    });
    
});