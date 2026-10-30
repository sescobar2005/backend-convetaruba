import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreateBranchDto } from './dto/create-branch.dto.js';
import { UpdateBranchDto } from './dto/update-branch.dto.js';

@Injectable()
export class BranchesService {
    constructor(
        private readonly prismaService: PrismaService,
    ) {}

    async createBranch(createBranchDto: CreateBranchDto) {
        try {
            return await this.prismaService.client.branch.create({
                data: {
                    name: createBranchDto.name,
                    slug: this.normalizeSlug(createBranchDto.slug),
                    address: createBranchDto.address,
                    city: createBranchDto.city,
                    department: createBranchDto.department,
                    phone: createBranchDto.phone,
                    email: createBranchDto.email,
                },
                select: {
                    idBranch: true,
                    name: true,
                    slug: true,
                    address: true,
                    city: true,
                    department: true,
                    phone: true,
                    email: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
        } catch (error: unknown) {
            if (this.isUniqueConstraintError(error)) {
                throw new ConflictException(
                    'A branch with this slug already exists',
                );
            }

            throw error;
        }
    }

    async findAllBranches() {
        return await this.prismaService.client.branch.findMany({
            orderBy: {
                createdAt: 'desc',
            },
            select: {
                idBranch: true,
                name: true,
                slug: true,
                address: true,
                city: true,
                department: true,
                phone: true,
                email: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }

    async findBranchById(idBranch: string) {
        const branch = await this.prismaService.client.branch.findUnique({
            where: {
                idBranch,
            },
            select: {
                idBranch: true,
                name: true,
                slug: true,
                address: true,
                city: true,
                department: true,
                phone: true,
                email: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!branch) {
            throw new NotFoundException('Branch not found');
        }

        return branch;
    }

    async updateBranch(
        idBranch: string,
        updateBranchDto: UpdateBranchDto,
    ) {
        const branch = await this.prismaService.client.branch.findUnique({
            where: {
                idBranch,
            },
            select: {
                idBranch: true,
            },
        });

        if (!branch) {
            throw new NotFoundException('Branch not found');
        }

        if (Object.keys(updateBranchDto).length === 0) {
            throw new BadRequestException(
                'At least one field must be provided',
            );
        }

        try {
            return await this.prismaService.client.branch.update({
                where: {
                    idBranch,
                },
                data: {
                    ...updateBranchDto,
                    ...(updateBranchDto.slug !== undefined && {
                        slug: this.normalizeSlug(updateBranchDto.slug),
                    }),
                },
                select: {
                    idBranch: true,
                    name: true,
                    slug: true,
                    address: true,
                    city: true,
                    department: true,
                    phone: true,
                    email: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
        } catch (error: unknown) {
            if (this.isUniqueConstraintError(error)) {
                throw new ConflictException(
                    'A branch with this slug already exists',
                );
            }

            throw error;
        }
    }

    async updateBranchStatus(
        idBranch: string,
        isActive: boolean,
    ) {
        const branch = await this.prismaService.client.branch.findUnique({
            where: {
                idBranch,
            },
            select: {
                idBranch: true,
            },
        });

        if (!branch) {
            throw new NotFoundException('Branch not found');
        }

        return await this.prismaService.client.branch.update({
            where: {
                idBranch,
            },
            data: {
                isActive,
            },
            select: {
                idBranch: true,
                name: true,
                slug: true,
                address: true,
                city: true,
                department: true,
                phone: true,
                email: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }

    private normalizeSlug(slug: string): string {
        return slug
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '-');
    }

    private isUniqueConstraintError(error: unknown): boolean {
        return (
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            error.code === 'P2002'
        );
    }
}