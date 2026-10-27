import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { createPetsServiceTestContext } from './pets.service.test-utils.js';

describe('PetsService.findAllByOwnerForStaff', () => {
    const { service, prismaMock } = createPetsServiceTestContext();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return active and inactive pets belonging to an existing owner', async () => {
        const ownerId = '550e8400-e29b-41d4-a716-446655440000';

        const owner = { idUser: ownerId };

        const pets = [
            {
                idPet: '660e8400-e29b-41d4-a716-446655440000',
                ownerId,
                name: 'Luna',
                isActive: true,
            },
            {
                idPet: '770e8400-e29b-41d4-a716-446655440000',
                ownerId,
                name: 'Max',
                isActive: false,
            },
        ];

        prismaMock.client.user.findUnique.mockResolvedValue(owner);
        prismaMock.client.pet.findMany.mockResolvedValue(pets);

        const result = await service.findAllByOwnerForStaff(ownerId);

        expect(prismaMock.client.user.findUnique).toHaveBeenCalledWith({
            where: { idUser: ownerId },
            select: { idUser: true },
        });

        expect(prismaMock.client.pet.findMany).toHaveBeenCalledWith({
            where: { ownerId },
            orderBy: { createdAt: 'desc' },
        });

        expect(result).toEqual(pets);
    });

    it('should throw NotFoundException when the owner does not exist', async () => {
        const ownerId = '550e8400-e29b-41d4-a716-446655440000';

        prismaMock.client.user.findUnique.mockResolvedValue(null);

        await expect(
            service.findAllByOwnerForStaff(ownerId),
        ).rejects.toThrow(NotFoundException);

        expect(prismaMock.client.pet.findMany).not.toHaveBeenCalled();
    });

    it('should return an empty array when the owner has no pets', async () => {
        const ownerId = '550e8400-e29b-41d4-a716-446655440000';

        prismaMock.client.user.findUnique.mockResolvedValue({
            idUser: ownerId,
        });
        prismaMock.client.pet.findMany.mockResolvedValue([]);

        const result = await service.findAllByOwnerForStaff(ownerId);

        expect(result).toEqual([]);
    });

});