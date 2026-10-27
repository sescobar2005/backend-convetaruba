import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PetSex, PetSpecies } from '../../../generated/prisma/client.js';
import { createPetsServiceTestContext } from './pets.service.test-utils.js';

describe('PetsService.updatePet', () => {
    const { service, prismaMock } = createPetsServiceTestContext();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should update the provided pet fields', async () => {
        const ownerId = '550e8400-e29b-41d4-a716-446655440000';
        const idPet = '660e8400-e29b-41d4-a716-446655440000';

        const dto = {
            name: 'Luna Updated',
            species: PetSpecies.CAT,
            color: 'White',
            sex: PetSex.FEMALE,
        };

        const existingPet = { idPet };
        const updatedPet = {
            idPet,
            ownerId,
            ...dto,
            isActive: true,
        };

        prismaMock.client.pet.findFirst.mockResolvedValue(existingPet);
        prismaMock.client.pet.update.mockResolvedValue(updatedPet);

        const result = await service.updatePet(idPet, ownerId, dto);

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
            data: dto,
        });

        expect(result).toEqual(updatedPet);
    });

    it('should convert the provided birth date into a Date object', async () => {
        const ownerId = '550e8400-e29b-41d4-a716-446655440000';
        const idPet = '660e8400-e29b-41d4-a716-446655440000';
        const dto = {
            dateOfBirth: '2022-05-10T00:00:00.000Z',
        };

        prismaMock.client.pet.findFirst.mockResolvedValue({ idPet });
        prismaMock.client.pet.update.mockResolvedValue({
            idPet,
            ownerId,
            dateOfBirth: new Date(dto.dateOfBirth),
        });

        await service.updatePet(idPet, ownerId, dto);

        expect(prismaMock.client.pet.update).toHaveBeenCalledWith({
            where: { idPet },
            data: {
                dateOfBirth: new Date(dto.dateOfBirth),
            },
        });
    });

    it('should allow clearing the birth date with an empty string', async () => {
        const ownerId = '550e8400-e29b-41d4-a716-446655440000';
        const idPet = '660e8400-e29b-41d4-a716-446655440000';
        const dto = { dateOfBirth: '' };

        prismaMock.client.pet.findFirst.mockResolvedValue({ idPet });
        prismaMock.client.pet.update.mockResolvedValue({
            idPet,
            ownerId,
            dateOfBirth: null,
        });

        await service.updatePet(idPet, ownerId, dto);

        expect(prismaMock.client.pet.update).toHaveBeenCalledWith({
            where: { idPet },
            data: { dateOfBirth: null },
        });
    });

    it('should throw NotFoundException when the pet does not exist or is inactive', async () => {
        const ownerId = '550e8400-e29b-41d4-a716-446655440000';
        const idPet = '660e8400-e29b-41d4-a716-446655440000';

        prismaMock.client.pet.findFirst.mockResolvedValue(null);

        await expect(
            service.updatePet(idPet, ownerId, { name: 'Luna Updated' }),
        ).rejects.toThrow(NotFoundException);

        expect(prismaMock.client.pet.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when the pet belongs to another owner', async () => {
        const ownerId = '550e8400-e29b-41d4-a716-446655440000';
        const idPet = '660e8400-e29b-41d4-a716-446655440000';

        prismaMock.client.pet.findFirst.mockResolvedValue(null);

        await expect(
            service.updatePet(idPet, ownerId, { name: 'Luna Updated' }),
        ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when no fields are provided', async () => {
        const ownerId = '550e8400-e29b-41d4-a716-446655440000';
        const idPet = '660e8400-e29b-41d4-a716-446655440000';

        prismaMock.client.pet.findFirst.mockResolvedValue({ idPet });

        await expect(
            service.updatePet(idPet, ownerId, {}),
        ).rejects.toThrow(BadRequestException);

        expect(prismaMock.client.pet.update).not.toHaveBeenCalled();
    });

});