import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreatePetDto } from './dto/create-pet.dto.js';
import { UpdatePetDto } from './dto/update-pet.dto.js';

@Injectable()
export class PetsService {
    constructor(private readonly prismaService: PrismaService){}


    async createPet(ownerId: string, dto: CreatePetDto) {
        const owner = await this.prismaService.client.user.findUnique({
            where: {
                idUser: ownerId,
            },
            select: {
                idUser: true,
            },
        });

        if (!owner) {
            throw new NotFoundException('Pet owner not found');
        }

        return this.prismaService.client.pet.create({
            data: {
                ownerId: owner.idUser,
                name: dto.name,
                species: dto.species,
                breed: dto.breed,
                color: dto.color,
                dateOfBirth: dto.dateOfBirth
                    ? new Date(dto.dateOfBirth)
                    : undefined,
                sex: dto.sex,
            },
        });
    }

    async findAllByOwner(ownerId: string) {
        return this.prismaService.client.pet.findMany({
            where: {
            ownerId,
            isActive: true,
            },
            orderBy: {
            createdAt: 'desc',
            },
        });
    }

    async updatePet(idPet: string, ownerId: string, dto: UpdatePetDto) {
        const pet = await this.prismaService.client.pet.findFirst({
            where: {
            idPet,
            ownerId,
            isActive: true,
            },
            select: {
            idPet: true,
            },
        });

        if (!pet) {
            throw new NotFoundException('Pet not found');
        }

        const data = {
            ...(dto.name !== undefined && { name: dto.name }),
            ...(dto.species !== undefined && { species: dto.species }),
            ...(dto.breed !== undefined && { breed: dto.breed }),
            ...(dto.color !== undefined && { color: dto.color }),
            ...(dto.dateOfBirth !== undefined && {
            dateOfBirth: dto.dateOfBirth
                ? new Date(dto.dateOfBirth)
                : null,
            }),
            ...(dto.sex !== undefined && { sex: dto.sex }),
        };

        if (Object.keys(data).length === 0) {
            throw new BadRequestException('At least one pet field must be provided');
        }

        return this.prismaService.client.pet.update({
            where: { idPet },
            data,
        });
    }

    async deactivatePet(idPet: string, ownerId: string) {
        const pet = await this.prismaService.client.pet.findFirst({
            where: {
                idPet,
                ownerId,
                isActive: true,
                },
                select: {
                idPet: true,
                },
        });

        if (!pet) {
            throw new NotFoundException('Pet not found');
        }

        return this.prismaService.client.pet.update({
            where: { idPet },
                data: {
                isActive: false,
            },
            select: {
                idPet: true,
                name: true,
                isActive: true,
                updatedAt: true,
            },
        });
    }
 
    async findByIdForOwner(idPet: string, ownerId: string) {
        const pet = await this.prismaService.client.pet.findFirst({
            where: {
            idPet,
            ownerId,
            isActive: true,
            },
        });

        if (!pet) {
            throw new NotFoundException('Pet not found');
        }

        return pet;
    }

    async findAllByOwnerForStaff(ownerId: string) {
        const owner = await this.prismaService.client.user.findUnique({
            where: {
                idUser: ownerId,
            },
            select: {
                idUser: true,
            },
        });

        if (!owner) {
            throw new NotFoundException('User not found');
        }

        return this.prismaService.client.pet.findMany({
            where: {
                ownerId: owner.idUser,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async findByIdForStaff(idPet: string) {
        const pet = await this.prismaService.client.pet.findUnique({
            where: {
                idPet,
            },
        });

        if (!pet) {
            throw new NotFoundException('Pet not found');
        }

        return pet;
    }

}
