import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { createPetsServiceTestContext } from './pets.service.test-utils.js';

describe('PetsService.findByIdForOwner', () => {
    const { service, prismaMock } = createPetsServiceTestContext();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return an active pet belonging to the owner', async () => {
        const ownerId = '550e8400-e29b-41d4-a716-446655440000';
        const idPet = '660e8400-e29b-41d4-a716-446655440000';

        const pet = {
            idPet,
            ownerId,
            name: 'Luna',
            isActive: true,
        };

        prismaMock.client.pet.findFirst.mockResolvedValue(pet);

        const result = await service.findByIdForOwner(idPet, ownerId);

        expect(prismaMock.client.pet.findFirst).toHaveBeenCalledWith({
            where: {
                idPet,
                ownerId,
                isActive: true,
            },
        });

        expect(result).toEqual(pet);
    });

    it('should throw NotFoundException when the pet does not exist', async () => {
        const ownerId = '550e8400-e29b-41d4-a716-446655440000';
        const idPet = '660e8400-e29b-41d4-a716-446655440000';

        prismaMock.client.pet.findFirst.mockResolvedValue(null);

        await expect(
            service.findByIdForOwner(idPet, ownerId),
        ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when the pet belongs to another owner', async () => {
        const ownerId = '550e8400-e29b-41d4-a716-446655440000';
        const anotherPetId = '770e8400-e29b-41d4-a716-446655440000';

        prismaMock.client.pet.findFirst.mockResolvedValue(null);

        await expect(
            service.findByIdForOwner(anotherPetId, ownerId),
        ).rejects.toThrow(NotFoundException);

        expect(prismaMock.client.pet.findFirst).toHaveBeenCalledWith({
            where: {
                idPet: anotherPetId,
                ownerId,
                isActive: true,
            },
        });
    });

});