import { registerAs } from '@nestjs/config';
import { JwtSignOptions } from '@nestjs/jwt';

export default registerAs('jwt', () => {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error('JWT_SECRET is not configured');
    }

    return {
        secret,
        signOptions: {
            expiresIn: '1h',
        } satisfies JwtSignOptions,
    };
});