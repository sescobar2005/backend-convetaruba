import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RolesGuard } from "../roles.guard.js";
import { ROLES_KEY } from "../../../decorators/roles.decorator.js";
import type { AuthenticatedRequest } from "../../../../common/types/authenticated-request.js";
import type { UserRole } from "../../../../common/types/user-role.type.js";

describe('RolesGuard', () => {
    let guard: RolesGuard;
    let reflectorMock: { getAllAndOverride: ReturnType<typeof vi.fn> };

    const customerRequest: AuthenticatedRequest = {
        user: {
            sub: 'user-123',
            role: 'CUSTOMER' as UserRole,
            tokenVersion: 0,
        },
    } as unknown as AuthenticatedRequest;

    const staffRequest: AuthenticatedRequest = {
        user: {
            sub: 'user-456',
            role: 'STAFF' as UserRole,
            tokenVersion: 0,
        },
    } as unknown as AuthenticatedRequest;

    const adminRequest: AuthenticatedRequest = {
        user: {
            sub: 'user-789',
            role: 'ADMIN' as UserRole,
            tokenVersion: 0,
        },
    } as unknown as AuthenticatedRequest;

    const noUserRequest: AuthenticatedRequest = {} as unknown as AuthenticatedRequest;

    const createMockContext = (
        request: AuthenticatedRequest,
        handler: Record<string, unknown> = {},
        clazz: Record<string, unknown> = {},
    ): ExecutionContext => ({
        getHandler: () => handler,
        getClass: () => clazz,
        switchToHttp: () => ({
            getRequest: () => request,
        }),
    }) as unknown as ExecutionContext;

    beforeEach(() => {
        reflectorMock = {
            getAllAndOverride: vi.fn(),
        };
        guard = new RolesGuard(reflectorMock as unknown as Reflector);
    });

    it('should return true when no roles are required', () => {
        reflectorMock.getAllAndOverride.mockReturnValue(undefined);
        const ctx = createMockContext(customerRequest);

        const result = guard.canActivate(ctx);

        expect(result).toBe(true);
    });

    it('should return true when user has an authorized role', () => {
        reflectorMock.getAllAndOverride.mockReturnValue(['ADMIN']);
        const ctx = createMockContext(adminRequest);

        const result = guard.canActivate(ctx);

        expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user role is not authorized', () => {
        reflectorMock.getAllAndOverride.mockReturnValue(['ADMIN']);
        const ctx = createMockContext(staffRequest);

        expect(() => guard.canActivate(ctx)).toThrow(
            new ForbiddenException('You do not have permission to perform this action'),
        );
    });

    it('should throw ForbiddenException when user is missing', () => {
        reflectorMock.getAllAndOverride.mockReturnValue(['ADMIN']);
        const ctx = createMockContext(noUserRequest);

        expect(() => guard.canActivate(ctx)).toThrow(
            new ForbiddenException('You do not have permission to perform this action'),
        );
    });

    it('should pass handler and class to getAllAndOverride in that order', () => {
        reflectorMock.getAllAndOverride.mockReturnValue(['ADMIN']);
        const handler = { methodRoles: ['ADMIN'] };
        const clazz = { classRoles: ['CUSTOMER'] };
        const ctx = createMockContext(staffRequest, handler, clazz);

        expect(() => guard.canActivate(ctx)).toThrow(
            new ForbiddenException('You do not have permission to perform this action'),
        );

        expect(reflectorMock.getAllAndOverride).toHaveBeenCalledWith(
            ROLES_KEY,
            [handler, clazz],
        );
    });

    it('should allow access when method metadata matches user role', () => {
        reflectorMock.getAllAndOverride.mockReturnValue(['STAFF']);
        const ctx = createMockContext(staffRequest);

        const result = guard.canActivate(ctx);

        expect(result).toBe(true);
    });
});
