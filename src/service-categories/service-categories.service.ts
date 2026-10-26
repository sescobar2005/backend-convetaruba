import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { CreateServiceCategoryDto } from "./dto/create-service-category.dto.js";
import { UpdateServiceCategoryDto } from "./dto/update-service-category.dto.js";


@Injectable()
export class ServiceCategoriesService {
    constructor(private readonly prismaService: PrismaService) {}

    async findActiveCategories() {
        return this.prismaService.client.serviceCategory.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });
    }

    async createCategory(createServiceCategoryDto: CreateServiceCategoryDto) {
        try {
            return await this.prismaService.client.serviceCategory.create({
                data: createServiceCategoryDto
            });
        } catch (error) {
            if (
                error instanceof Error &&
                'code' in error &&
                error.code === 'P2002'
            ) {
                throw new BadRequestException('A category with this slug already exists');
            }

            throw error;
        }
    }

    async updateCategory(idCategory: string, updateServiceCategoryDto: UpdateServiceCategoryDto) {
        if (Object.keys(updateServiceCategoryDto).length === 0) {
            throw new BadRequestException('At least one field must be provided');
        }

        const existingCategory = await this.prismaService.client.serviceCategory.findUnique({
            where: { idCategory },
            select: { idCategory: true }
        });

        if (!existingCategory) {
            throw new NotFoundException('Category not found');
        }

        try {
            return await this.prismaService.client.serviceCategory.update({
                where: { idCategory },
                data: updateServiceCategoryDto
            });
        } catch (error) {
            if (
                error instanceof Error &&
                'code' in error &&
                error.code === 'P2002'
            ) {
                throw new BadRequestException('A category with this slug already exists');
            }

            throw error;
        }
    }

    async deactivateCategory(idCategory: string) {
        const existingCategory = await this.prismaService.client.serviceCategory.findUnique({
            where: { idCategory },
            select: {
                idCategory: true,
                isActive: true
            }
        });

        if (!existingCategory || !existingCategory.isActive) {
            throw new NotFoundException('Active category not found');
        }

        const activeServices = await this.prismaService.client.service.count({
            where: {
                categoryId: idCategory,
                isActive: true
            }
        });

        if (activeServices > 0) {
            throw new BadRequestException('Cannot deactivate a category with active services');
        }

        return this.prismaService.client.serviceCategory.update({
            where: { idCategory },
            data: { isActive: false },
            select: {
                idCategory: true,
                name: true,
                slug: true,
                isActive: true
            }
        });
    }
    
}