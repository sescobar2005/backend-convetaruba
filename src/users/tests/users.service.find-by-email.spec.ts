import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createUsersServiceTestContext } from './users.service.test-utils.js';  
  
describe('UsersService - findByEmail', () => {

    let service: ReturnType<typeof createUsersServiceTestContext>['service'];
    let prismaMock: ReturnType<typeof createUsersServiceTestContext>['prismaMock'];

    beforeEach(() => {
        ({ service, prismaMock } = createUsersServiceTestContext());
    });

    it('should return the user when the email exists', async () => {
        const user = {
        idUser: 'user-123',
        email: 'ana@example.com',
        passwordHash: 'hashed-password',
        role: 'CUSTOMER'
        };

        prismaMock.client.user.findUnique.mockResolvedValue(user);

        const result = await service.findByEmail('ana@example.com');

        expect(result).toEqual(user);
        expect(prismaMock.client.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'ana@example.com' }
        });
    });

    it('should return null when the email does not exist', async () => {
        prismaMock.client.user.findUnique.mockResolvedValue(null);

        const result = await service.findByEmail('missing@example.com');

        expect(result).toBeNull();
    });

});