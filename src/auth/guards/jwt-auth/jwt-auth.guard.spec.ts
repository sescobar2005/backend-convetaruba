import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { JwtAuthGuard } from "./jwt-auth.guard.js";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../../prisma/prisma.service.js";


describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  const jwtServiceMock = {
    verifyAsync: vi.fn()
  };

  const prismaServiceMock = {
    client: {
      user: {
        findUnique: vi.fn()
      },
    },
  };

  const request = {
    headers: {
      authorization: 'Bearer valid-token'
    },
    user: undefined as
      | {
        sub: string;
        role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
        tokenVersion: number;
        }
      | undefined
  };

  const payload = {
    sub: 'user-123',
    role: 'CUSTOMER' as const,
    tokenVersion: 0
  };

  let context: ExecutionContext;

  beforeEach(() => {
    vi.clearAllMocks();

    request.headers.authorization = 'Bearer valid-token';
    request.user = undefined;

    context = {
      switchToHttp: () => ({
        getRequest: () => request
      })
    } as unknown as ExecutionContext;

    guard = new JwtAuthGuard(
      jwtServiceMock as unknown as JwtService,
      prismaServiceMock as unknown as PrismaService
    );
  });

  it('should allow access with a valid token', async () => {
    jwtServiceMock.verifyAsync.mockResolvedValue(payload);
    prismaServiceMock.client.user.findUnique.mockResolvedValue({ tokenVersion: 0 });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    
    expect(jwtServiceMock.verifyAsync).toHaveBeenCalledWith('valid-token');
    expect(prismaServiceMock.client.user.findUnique).toHaveBeenCalledWith({
      where: { idUser: payload.sub },
      select: { tokenVersion: true }
    });

    expect(request.user).toEqual(payload);
  });

  it('should reject requests without a bearer token', async () => {
    request.headers.authorization = undefined as unknown as string;

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Missing access token')
    );
    
    expect(jwtServiceMock.verifyAsync).not.toHaveBeenCalled();
  });

  it('should reject requests with an invalid authorization scheme', async () => {
    request.headers.authorization = 'Basic some-token';

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Missing access token')
    );
    
    expect(jwtServiceMock.verifyAsync).not.toHaveBeenCalled();
  });

  it('should reject invalid or expired tokens', async () => {
    jwtServiceMock.verifyAsync.mockRejectedValue(new Error('Token expired'));

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Invalid or expired access token')
    );

    expect(prismaServiceMock.client.user.findUnique).not.toHaveBeenCalled();
  });

  it('should reject tokens with an invalid payload', async () => {
    jwtServiceMock.verifyAsync.mockResolvedValue({
      ...payload,
      role: 'SUPERADMIN'
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Invalid access token')
    );

    expect(prismaServiceMock.client.user.findUnique).not.toHaveBeenCalled();
  });

  it('should reject tokens belonging to a nonexistent user', async () => {
    jwtServiceMock.verifyAsync.mockResolvedValue(payload);
    prismaServiceMock.client.user.findUnique.mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Access token is no longer valid')
    );
  });

  it('should reject tokens with an outdated tokenVersion', async () => {
    jwtServiceMock.verifyAsync.mockResolvedValue(payload);
    prismaServiceMock.client.user.findUnique.mockResolvedValue({
      tokenVersion: 1
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Access token is no longer valid')
    );

    expect(request.user).toBeUndefined();
  });
});