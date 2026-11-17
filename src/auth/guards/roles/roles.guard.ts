import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { ROLES_KEY, UserRole } from "../../decorators/roles.decorator.js";
import { Reflector } from "@nestjs/core";
import type { AuthenticatedRequest } from "../../../common/types/authenticated-request.js";


@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector){}

    canActivate(context: ExecutionContext): boolean {

        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
            ROLES_KEY,
            [context.getHandler(), context.getClass()]
        );

        if (!requiredRoles?.length) {
            return true;
        }

        const request = context
            .switchToHttp()
            .getRequest<AuthenticatedRequest>();
        
        if (!request.user || !requiredRoles.includes(request.user.role)) {
            throw new ForbiddenException('You do not have permission to perform this action');
        }

        return true;
    }

}