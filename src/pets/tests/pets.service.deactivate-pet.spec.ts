import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { createPetsServiceTestContext } from './pets.service.test-utils.js';

describe('PetsService.deactivatePet', () => {
    const { service, prismaMock } = createPetsServiceTestContext();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should deactivate an active pet without deleting its record', async () => {
        const ownerId = '550e8400-e29b-41d4-a716-446655440000';
        const idPet = '660e8400-e29b-41d4-a716-446655440000';

        const existingPet = { idPet };

        const deactivatedPet = {
            idPet,
            name: 'Luna',
            isActive: false,
            updatedAt: new Date('2026-10-27T12:00:00.000Z'),
        };

        prismaMock.client.pet.findFirst.mockResolvedValue(existingPet);
        prismaMock.client.pet.update.mockResolvedValue(deactivatedPet);

        const result = await service.deactivatePet(idPet, ownerId);

        expect(prismaMock.client.pet.findFirst).toHaveBeenCalledWith({
            where: {
                idPet,
                ownerId,
                isActive: true,
            },
            select: { idPet: true },
        });

        expect(prismaMock.client.pet.update).toHaveBeenCalledWith({
            where: { idPet },
            data: { isActive: false },
            select: {
                idPet: true,
                name: true,
                isActive: true,
                updatedAt: true,
            },
        });

        expect(result).toEqual(deactivatedPet);
        expect(result.isActive).toBe(false);
    });

    it('should throw NotFoundException when the pet does not exist', async () => {
        const ownerId = '550e8400-e29b-41d4-a716-446655440000';
        const idPet = '660e8400-e29b-41d4-a716-446655440000';

        prismaMock.client.pet.findFirst.mockResolvedValue(null);

        await expect(
            service.deactivatePet(idPet, ownerId),
        ).rejects.toThrow(NotFoundException);

        expect(prismaMock.client.pet.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when the pet is already inactive', async () => {
        const ownerId = '550e8400-e29b-41d4-a716-446655440000';
        const idPet = '660e8400-e29b-41d4-a716-446655440000';

        prismaMock.client.pet.findFirst.mockResolvedValue(null);

        await expect(
            service.deactivatePet(idPet, ownerId),
        ).rejects.toThrow(NotFoundException);

        expect(prismaMock.client.pet.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when the pet belongs to another owner', async () => {
        const ownerId = '550e8400-e29b-41d4-a716-446655440000';
        const idPet = '660e8400-e29b-41d4-a716-446655440000';

        prismaMock.client.pet.findFirst.mockResolvedValue(null);

        await expect(
            service.deactivatePet(idPet, ownerId),
        ).rejects.toThrow(NotFoundException);

        expect(prismaMock.client.pet.update).not.toHaveBeenCalled();
    });

});