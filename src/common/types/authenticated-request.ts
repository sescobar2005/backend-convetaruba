import type { Request } from 'express';
import type { UserRole } from './user-role.type.js';

export interface AuthenticatedRequest extends Request {
    user: {
        sub: string;
        role: UserRole;
        tokenVersion: number;
    };
}
