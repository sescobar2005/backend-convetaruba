import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { createPetsServiceTestContext } from './pets.service.test-utils.js';

describe('PetsService.findByIdForStaff', () => {
    const { service, prismaMock } = createPetsServiceTestContext();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return a pet even when it is inactive', async () => {
        const idPet = '660e8400-e29b-41d4-a716-446655440000';

        const pet = {
            idPet,
            ownerId: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Luna',
            isActive: false,
        };

        prismaMock.client.pet.findUnique.mockResolvedValue(pet);

        const result = await service.findByIdForStaff(idPet);

        expect(prismaMock.client.pet.findUnique).toHaveBeenCalledWith({
            where: { idPet },
        });

        expect(result).toEqual(pet);
    });

    it('should return an active pet', async () => {
        const idPet = '660e8400-e29b-41d4-a716-446655440000';

        const pet = {
            idPet,
            ownerId: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Luna',
            isActive: true,
        };

        prismaMock.client.pet.findUnique.mockResolvedValue(pet);

        const result = await service.findByIdForStaff(idPet);

        expect(result).toEqual(pet);
    });

    it('should throw NotFoundException when the pet does not exist', async () => {
        const idPet = '660e8400-e29b-41d4-a716-446655440000';

        prismaMock.client.pet.findUnique.mockResolvedValue(null);

        await expect(
            service.findByIdForStaff(idPet),
        ).rejects.toThrow(NotFoundException);
    });

});