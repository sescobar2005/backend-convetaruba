import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    ForbiddenException,
    UnauthorizedException,
} from '@nestjs/common';
import { PetsController } from './pets.controller.js';
import { PetsService } from './pets.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard.js';
import { PetSex, PetSpecies } from '../../generated/prisma/enums.js';

describe('PetsController', () => {
    const petsServiceMock = {
        createPet: vi.fn(),
        findAllByOwner: vi.fn(),
        findAllByOwnerForStaff: vi.fn(),
        findByIdForOwner: vi.fn(),
        findByIdForStaff: vi.fn(),
        updatePet: vi.fn(),
        deactivatePet: vi.fn(),
    };

    const controller = new PetsController(
        petsServiceMock as unknown as PetsService,
    );

    const ownerId = '550e8400-e29b-41d4-a716-446655440000';
    const idPet = '660e8400-e29b-41d4-a716-446655440000';

    const customerRequest = {
        user: {
            sub: ownerId,
            role: 'CUSTOMER' as const,
            tokenVersion: 0,
        },
    };

    const staffRequest = {
        user: {
            sub: '770e8400-e29b-41d4-a716-446655440000',
            role: 'STAFF' as const,
            tokenVersion: 0,
        },
    };

    const adminRequest = {
        user: {
            sub: '880e8400-e29b-41d4-a716-446655440000',
            role: 'ADMIN' as const,
            tokenVersion: 0,
        },
    };

    const createPetDto = {
        name: 'Luna',
        species: PetSpecies.DOG,
        breed: 'Labrador',
        color: 'Golden',
        dateOfBirth: '2022-05-10T00:00:00.000Z',
        sex: PetSex.FEMALE,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should create a pet for the authenticated customer', async () => {
        const createdPet = { idPet, ownerId, name: 'Luna' };
        petsServiceMock.createPet.mockResolvedValue(createdPet);

        const result = await controller.createPet(
            createPetDto,
            customerRequest as never,
        );

        expect(petsServiceMock.createPet).toHaveBeenCalledWith(
            ownerId,
            createPetDto,
        );
        expect(result).toEqual(createdPet);
    });

    it('should throw UnauthorizedException when customer identity is missing', () => {
        expect(() =>
            controller.createPet(createPetDto, {} as never),
        ).toThrow(UnauthorizedException);

        expect(petsServiceMock.createPet).not.toHaveBeenCalled();
    });

    it('should allow staff to create a pet for another owner', async () => {
        petsServiceMock.createPet.mockResolvedValue({ idPet, ownerId });

        const result = await controller.createPetForOwner(
            ownerId,
            createPetDto,
            staffRequest as never,
        );

        expect(petsServiceMock.createPet).toHaveBeenCalledWith(
            ownerId,
            createPetDto,
        );
        expect(result).toEqual({ idPet, ownerId });
    });

    it('should allow administrators to create a pet for another owner', async () => {
        petsServiceMock.createPet.mockResolvedValue({ idPet, ownerId });

        await controller.createPetForOwner(
            ownerId,
            createPetDto,
            adminRequest as never,
        );

        expect(petsServiceMock.createPet).toHaveBeenCalledWith(
            ownerId,
            createPetDto,
        );
    });

    it('should reject customers who try to create a pet for another owner', () => {
        expect(() =>
            controller.createPetForOwner(
                ownerId,
                createPetDto,
                customerRequest as never,
            ),
        ).toThrow(ForbiddenException);

        expect(petsServiceMock.createPet).not.toHaveBeenCalled();
    });

    it('should return the authenticated customer’s active pets', async () => {
        const pets = [{ idPet, ownerId, name: 'Luna', isActive: true }];
        petsServiceMock.findAllByOwner.mockResolvedValue(pets);

        const result = await controller.findAllByOwner(
            customerRequest as never,
        );

        expect(petsServiceMock.findAllByOwner).toHaveBeenCalledWith(ownerId);
        expect(result).toEqual(pets);
    });

    it('should allow staff to list all pets belonging to an owner', async () => {
        const pets = [
            { idPet, ownerId, name: 'Luna', isActive: true },
            { idPet: '990e8400-e29b-41d4-a716-446655440000', ownerId, name: 'Max', isActive: false },
        ];
        petsServiceMock.findAllByOwnerForStaff.mockResolvedValue(pets);

        const result = await controller.findAllByOwnerForStaff(
            ownerId,
            staffRequest as never,
        );

        expect(
            petsServiceMock.findAllByOwnerForStaff,
        ).toHaveBeenCalledWith(ownerId);
        expect(result).toEqual(pets);
    });

    it('should reject customers who try to list another owner’s pets', () => {
        expect(() =>
            controller.findAllByOwnerForStaff(
                ownerId,
                customerRequest as never,
            ),
        ).toThrow(ForbiddenException);

        expect(
            petsServiceMock.findAllByOwnerForStaff,
        ).not.toHaveBeenCalled();
    });

    it('should allow staff to retrieve a pet by ID', async () => {
        const pet = { idPet, ownerId, name: 'Luna', isActive: false };
        petsServiceMock.findByIdForStaff.mockResolvedValue(pet);

        const result = await controller.findByIdForStaff(
            idPet,
            staffRequest as never,
        );

        expect(petsServiceMock.findByIdForStaff).toHaveBeenCalledWith(idPet);
        expect(result).toEqual(pet);
    });

    it('should reject customers who try to retrieve a pet through the staff route', () => {
        expect(() =>
            controller.findByIdForStaff(
                idPet,
                customerRequest as never,
            ),
        ).toThrow(ForbiddenException);

        expect(petsServiceMock.findByIdForStaff).not.toHaveBeenCalled();
    });

    it('should return a pet belonging to the authenticated customer', async () => {
        const pet = { idPet, ownerId, name: 'Luna', isActive: true };
        petsServiceMock.findByIdForOwner.mockResolvedValue(pet);

        const result = await controller.findById(
            idPet,
            customerRequest as never,
        );

        expect(petsServiceMock.findByIdForOwner).toHaveBeenCalledWith(
            idPet,
            ownerId,
        );
        expect(result).toEqual(pet);
    });

    it('should update a pet belonging to the authenticated customer', async () => {
        const dto = { name: 'Luna Updated' };
        const updatedPet = { idPet, ownerId, ...dto };
        petsServiceMock.updatePet.mockResolvedValue(updatedPet);

        const result = await controller.updatePet(
            idPet,
            dto,
            customerRequest as never,
        );

        expect(petsServiceMock.updatePet).toHaveBeenCalledWith(
            idPet,
            ownerId,
            dto,
        );
        expect(result).toEqual(updatedPet);
    });

    it('should deactivate a pet belonging to the authenticated customer', async () => {
        const deactivatedPet = {
            idPet,
            name: 'Luna',
            isActive: false,
        };
        petsServiceMock.deactivatePet.mockResolvedValue(deactivatedPet);

        const result = await controller.deactivatePet(
            idPet,
            customerRequest as never,
        );

        expect(petsServiceMock.deactivatePet).toHaveBeenCalledWith(
            idPet,
            ownerId,
        );
        expect(result).toEqual(deactivatedPet);
    });

    it('should throw UnauthorizedException when identity is missing during pet lookup', () => {
        expect(() =>
            controller.findById(idPet, {} as never),
        ).toThrow(UnauthorizedException);

        expect(petsServiceMock.findByIdForOwner).not.toHaveBeenCalled();
    });

});