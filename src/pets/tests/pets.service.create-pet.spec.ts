import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { PetSex, PetSpecies } from '../../../generated/prisma/client.js';
import { createPetsServiceTestContext } from './pets.service.test-utils.js';

describe('PetsService.createPet', () => {
    const { service, prismaMock } = createPetsServiceTestContext();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const createPetDto = {
        name: 'Luna',
        species: PetSpecies.DOG,
        breed: 'Labrador',
        color: 'Golden',
        dateOfBirth: '2022-05-10T00:00:00.000Z',
        sex: PetSex.FEMALE,
    };

    it('should create a pet for an existing owner', async () => {
        const ownerId = '550e8400-e29b-41d4-a716-446655440000';
        const owner = { idUser: ownerId };
        const createdPet = {
            idPet: '660e8400-e29b-41d4-a716-446655440000',
            ownerId,
            ...createPetDto,
            dateOfBirth: new Date(createPetDto.dateOfBirth),
            isActive: true,
        };

        prismaMock.client.user.findUnique.mockResolvedValue(owner);
        prismaMock.client.pet.create.mockResolvedValue(createdPet);

        const result = await service.createPet(ownerId, createPetDto);

        expect(prismaMock.client.user.findUnique).toHaveBeenCalledWith({
            where: { idUser: ownerId },
            select: { idUser: true },
        });

        expect(prismaMock.client.pet.create).toHaveBeenCalledWith({
            data: {
                ownerId,
                name: createPetDto.name,
                species: createPetDto.species,
                breed: createPetDto.breed,
                color: createPetDto.color,
                dateOfBirth: new Date(createPetDto.dateOfBirth),
                sex: createPetDto.sex,
            },
        });

        expect(result).toEqual(createdPet);
    });

    it('should throw NotFoundException when the owner does not exist', async () => {
        const ownerId = '550e8400-e29b-41d4-a716-446655440000';

        prismaMock.client.user.findUnique.mockResolvedValue(null);

        await expect(
            service.createPet(ownerId, createPetDto),
        ).rejects.toThrow(NotFoundException);

        expect(prismaMock.client.pet.create).not.toHaveBeenCalled();
    });

});