import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service.js';
import { AssignBranchServiceDto } from './dto/assign-branch-service.dto.js';
import { UpdateBranchServicePriceDto } from './dto/update-branch-service-price.dto.js';

@Injectable()
export class BranchServicesService {
    constructor(
        private readonly prismaService: PrismaService,
    ) {}

    async assignServiceToBranch(
        branchId: string,
        assignBranchServiceDto: AssignBranchServiceDto,
    ) {
        const { serviceId } = assignBranchServiceDto;

        const branch = await this.prismaService.client.branch.findUnique({
            where: { idBranch: branchId },
            select: {
                idBranch: true,
                isActive: true,
            },
        });

        if (!branch || !branch.isActive) {
            throw new NotFoundException('Active branch not found');
        }

        const service = await this.prismaService.client.service.findUnique({
            where: { idService: serviceId },
            select: {
                idService: true,
                isActive: true,
                isPublished: true,
            },
        });

        if (!service || !service.isActive) {
            throw new NotFoundException('Active service not found');
        }

        if (!service.isPublished) {
            throw new BadRequestException(
                'Service must be published before being assigned to a branch',
            );
        }

        const existingAssignment =
            await this.prismaService.client.branchService.findUnique({
                where: {
                    branchId_serviceId: {
                        branchId,
                        serviceId,
                    },
                },
                select: {
                    idBranchService: true,
                    isActive: true,
                },
            });

        if (existingAssignment) {
            throw new ConflictException(
                existingAssignment.isActive
                    ? 'Service is already assigned to this branch'
                    : 'Service has an inactive assignment. Reactivate the existing assignment instead',
            );
        }

        try {
            return await this.prismaService.client.branchService.create({
                data: {
                    branchId,
                    serviceId,
                },
                include: {
                    service: true,
                    branch: true,
                },
            });
        } catch (error) {
            if (
                error instanceof Error &&
                'code' in error &&
                error.code === 'P2002'
            ) {
                throw new ConflictException(
                    'Service is already assigned to this branch',
                );
            }

            throw error;
        }
    }

    async findBranchServices(branchId: string) {
        const branch = await this.prismaService.client.branch.findUnique({
            where: { idBranch: branchId },
            select: {
                idBranch: true,
            },
        });

        if (!branch) {
            throw new NotFoundException('Branch not found');
        }

        return this.prismaService.client.branchService.findMany({
            where: {
                branchId,
            },
            include: {
                service: {
                    include: {
                        category: true,
                    },
                },
                prices: {
                    where: {
                        validUntil: null,
                    },
                    take: 1,
                },
            },
            orderBy: {
                service: {
                    name: 'asc',
                },
            },
        });
    }

    async findServiceBranches(serviceId: string) {
        const service = await this.prismaService.client.service.findUnique({
            where: { idService: serviceId },
            select: {
                idService: true,
            },
        });

        if (!service) {
            throw new NotFoundException('Service not found');
        }

        return this.prismaService.client.branchService.findMany({
            where: {
                serviceId,
            },
            include: {
                branch: true,
                prices: {
                    where: {
                        validUntil: null,
                    },
                    take: 1,
                },
            },
            orderBy: {
                branch: {
                    name: 'asc',
                },
            },
        });
    }

    async updateBranchServiceStatus(
        branchId: string,
        branchServiceId: string,
        isActive: boolean,
    ) {
        const branch = await this.prismaService.client.branch.findUnique({
            where: { idBranch: branchId },
            select: {
                idBranch: true,
            },
        });

        if (!branch) {
            throw new NotFoundException('Branch not found');
        }

        const branchService =
            await this.prismaService.client.branchService.findUnique({
                where: {
                    idBranchService: branchServiceId,
                },
                select: {
                    idBranchService: true,
                    branchId: true,
                    isActive: true,
                    service: {
                        select: {
                            isActive: true,
                            isPublished: true,
                        },
                    },
                },
            });

        if (!branchService || branchService.branchId !== branchId) {
            throw new NotFoundException(
                'Branch service assignment not found',
            );
        }

        if (branchService.isActive === isActive) {
            throw new BadRequestException(
                isActive
                    ? 'Service is already active in this branch'
                    : 'Service is already inactive in this branch',
            );
        }

        if (
            isActive &&
            (!branchService.service.isActive ||
                !branchService.service.isPublished)
        ) {
            throw new BadRequestException(
                'Only active and published services can be activated in a branch',
            );
        }

        return this.prismaService.client.branchService.update({
            where: {
                idBranchService: branchServiceId,
            },
            data: {
                isActive,
            },
            include: {
                service: true,
                branch: true,
            },
        });
    }

    async updateBranchServicePrice(
        branchId: string,
        branchServiceId: string,
        updateBranchServicePriceDto: UpdateBranchServicePriceDto,
    ) {
        const { amount } = updateBranchServicePriceDto;

        const branchService =
            await this.prismaService.client.branchService.findUnique({
                where: {
                    idBranchService: branchServiceId,
                },
                select: {
                    idBranchService: true,
                    branchId: true,
                    isActive: true,
                },
            });

        if (!branchService || branchService.branchId !== branchId) {
            throw new NotFoundException(
                'Branch service assignment not found',
            );
        }

        if (!branchService.isActive) {
            throw new BadRequestException(
                'Cannot update the price of an inactive branch service',
            );
        }

        return this.prismaService.client.$transaction(async (transaction) => {
            const currentPrice =
                await transaction.branchServicePrice.findFirst({
                    where: {
                        branchServiceId,
                        validUntil: null,
                    },
                    orderBy: {
                        validFrom: 'desc',
                    },
                });

            const now = new Date();

            if (currentPrice) {
                if (currentPrice.amount.equals(amount)) {
                    throw new BadRequestException(
                        'The new price must be different from the current price',
                    );
                }

                if (now <= currentPrice.validFrom) {
                    throw new BadRequestException(
                        'The current price cannot be closed before its start date',
                    );
                }

                await transaction.branchServicePrice.update({
                    where: {
                        idBranchServicePrice:
                            currentPrice.idBranchServicePrice,
                    },
                    data: {
                        validUntil: now,
                    },
                });
            }

            return transaction.branchServicePrice.create({
                data: {
                    branchServiceId,
                    amount,
                    validFrom: now,
                },
            });
        });
    }

    async findBranchServicePriceHistory(
        branchId: string,
        branchServiceId: string,
    ) {
        const branchService =
            await this.prismaService.client.branchService.findUnique({
                where: {
                    idBranchService: branchServiceId,
                },
                select: {
                    idBranchService: true,
                    branchId: true,
                },
            });

        if (!branchService || branchService.branchId !== branchId) {
            throw new NotFoundException(
                'Branch service assignment not found',
            );
        }

        return this.prismaService.client.branchServicePrice.findMany({
            where: {
                branchServiceId,
            },
            orderBy: {
                validFrom: 'desc',
            },
        });
    }
}