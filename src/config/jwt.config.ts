import type { SignOptions } from 'jsonwebtoken';
import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error('JWT_SECRET is not configured');
    }

    return {
        secret,
        signOptions: {
            expiresIn: '1h' as SignOptions['expiresIn'],
        },
    };
});