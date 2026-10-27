import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPetsServiceTestContext } from './pets.service.test-utils.js';

describe('PetsService.findAllByOwner', () => {
    const { service, prismaMock } = createPetsServiceTestContext();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return active pets belonging to the owner', async () => {
        const ownerId = '550e8400-e29b-41d4-a716-446655440000';

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
                isActive: true,
            },
        ];

        prismaMock.client.pet.findMany.mockResolvedValue(pets);

        const result = await service.findAllByOwner(ownerId);

        expect(prismaMock.client.pet.findMany).toHaveBeenCalledWith({
            where: {
                ownerId,
                isActive: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        expect(result).toEqual(pets);
    });

    it('should return an empty array when the owner has no active pets', async () => {
        const ownerId = '550e8400-e29b-41d4-a716-446655440000';

        prismaMock.client.pet.findMany.mockResolvedValue([]);

        const result = await service.findAllByOwner(ownerId);

        expect(result).toEqual([]);
        expect(prismaMock.client.pet.findMany).toHaveBeenCalledWith({
            where: {
                ownerId,
                isActive: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    });

});