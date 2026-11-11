import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateServiceDto } from './dto/create-service.dto.js';
import { UpdateServiceDto } from './dto/update-service.dto.js';
import { UpdateServiceStatusDto } from './dto/update-service-status.dto.js';

@Injectable()
export class ServicesService {
    constructor(private readonly prismaService: PrismaService) {}

    async findPublishedServices() {
        return this.prismaService.client.service.findMany({
            where: {
                isActive: true,
                isPublished: true,
                category: {
                    is: {
                        isActive: true
                    }
                }
            },
            include: {
                category: true
            },
            orderBy: {
                name: 'asc'
            }
        });
    }

    async createService(createServiceDto: CreateServiceDto) {
        const { categoryId, ...serviceData } = createServiceDto;

        const category = await this.prismaService.client.serviceCategory.findUnique({
            where: { idCategory: categoryId },
            select: {
                idCategory: true,
                isActive: true
            }
        });

        if (!category || !category.isActive) {
            throw new NotFoundException('Category not found or inactive');
        }

        try {
            return await this.prismaService.client.service.create({
                data: {
                    ...serviceData,
                    categoryId
                },
                include: {
                    category: true
                }
            });

        } catch (error) {
            if (
                error instanceof Error &&
                'code' in error &&
                error.code === 'P2002'
            ) {
                throw new BadRequestException('A service with this slug already exists');
            }

            throw error;
        }
    }

    async updateService(idService: string, updateServiceDto: UpdateServiceDto) {
        if (Object.keys(updateServiceDto).length === 0) {
            throw new BadRequestException('At least one field must be provided');
        }

        const existingService = await this.prismaService.client.service.findUnique({
            where: { idService },
            select: { idService: true }
        });

        if (!existingService) {
            throw new NotFoundException('Service not found');
        }

        const { categoryId, ...serviceData } = updateServiceDto;

        if (categoryId !== undefined) {
            const category = await this.prismaService.client.serviceCategory.findUnique({
                where: { idCategory: categoryId },
                select: {
                    idCategory: true,
                    isActive: true
                }
            });

            if (!category || !category.isActive) {
                throw new NotFoundException('Category not found or inactive');
            }
        }

        try {
            return await this.prismaService.client.service.update({
                where: { idService },
                data: {
                    ...serviceData,
                    ...(categoryId !== undefined ? { categoryId } : {})
                },
                include: { category: true }
            });
        } catch (error) {
            if (
                error instanceof Error &&
                'code' in error &&
                error.code === 'P2002'
            ) {
                throw new BadRequestException('A service with this slug already exists');
            }

            throw error;

        }
    }

    async deactivateService(idService: string) {
        const existingService = await this.prismaService.client.service.findUnique({
            where: { idService },
            select: { 
                idService: true,
                isActive: true
            }
        });

        if (!existingService || !existingService.isActive) {
            throw new NotFoundException('Active service not found');
        }

        return this.prismaService.client.service.update({
            where: { idService },
            data: { isActive: false },
            select: {
                idService: true,
                name: true,
                slug: true,
                isActive: true
            }
        });
    }

    async updateServiceStatus(
        idService: string,
        updateServiceStatusDto: UpdateServiceStatusDto,
    ) {
        if (Object.keys(updateServiceStatusDto).length === 0) {
            throw new BadRequestException(
                'At least one status field must be provided',
            );
        }

        const existingService = await this.prismaService.client.service.findUnique({
            where: { idService },
            select: {
                idService: true,
                isActive: true,
                isPublished: true,
            },
        });

        if (!existingService) {
            throw new NotFoundException('Service not found');
        }

        const nextIsActive =
            updateServiceStatusDto.isActive ?? existingService.isActive;

        if (updateServiceStatusDto.isPublished === true && !nextIsActive) {
            throw new BadRequestException(
                'An inactive service cannot be published',
            );
        }

        const data = {
            ...(updateServiceStatusDto.isActive !== undefined
                ? { isActive: updateServiceStatusDto.isActive }
                : {}),
            ...(updateServiceStatusDto.isPublished !== undefined
                ? { isPublished: updateServiceStatusDto.isPublished }
                : {}),
            ...(updateServiceStatusDto.isActive === false
                ? { isPublished: false }
                : {}),
        };

        return this.prismaService.client.service.update({
            where: { idService },
            data,
            include: {
                category: true,
            },
        });
    }

}