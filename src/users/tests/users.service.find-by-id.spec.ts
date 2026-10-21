import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { createUsersServiceTestContext } from './users.service.test-utils.js';

describe('UsersService - findById', () => {

  let service: ReturnType<typeof createUsersServiceTestContext>['service'];
  let prismaMock: ReturnType<typeof createUsersServiceTestContext>['prismaMock'];

  beforeEach(() => {
      ({ service, prismaMock } = createUsersServiceTestContext());
  });

  it('should return a user without sensitive fields', async () => {
    const user = {
      idUser: 'user-123',
      firstName: 'Ana',
      lastName: 'Gomez',
      email: 'ana@example.com',
      mobileNumber: '3001234567',
      role: 'CUSTOMER',
      createdAt: new Date('2026-01-01T10:00:00Z'),
      updatedAt: new Date('2026-01-02T10:00:00Z'),
      whatsappReminders: false,
    };

    prismaMock.client.user.findUnique.mockResolvedValue(user);

    const result = await service.findById('user-123');

    expect(result).toEqual(user);
    expect(result).not.toHaveProperty('passwordHash');

    expect(prismaMock.client.user.findUnique).toHaveBeenCalledWith({
      where: { idUser: 'user-123' },
      select: {
        idUser: true,
        firstName: true,
        lastName: true,
        email: true,
        mobileNumber: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        whatsappReminders: true,
      }
    });
  });

  it('should throw NotFoundException when the user does not exist', async () => {
    prismaMock.client.user.findUnique.mockResolvedValue(null);

    await expect(service.findById('unknown-user')).rejects.toThrow(
      NotFoundException
    );

    expect(prismaMock.client.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { idUser: 'unknown-user' },
      }),
    );
  });
  
});