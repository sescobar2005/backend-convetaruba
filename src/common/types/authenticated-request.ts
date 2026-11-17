import type { Request } from 'express';

export interface AuthenticatedRequest extends Request {
    user?: {
        sub: string;
        role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
        tokenVersion: number;
    };
}
