import { NotFoundException } from '@nestjs/common';
import {
    beforeEach,
    describe,
    expect,
    it,
} from 'vitest';

import { createBranchServicesServiceTestContext } from './branch-services-test.utils.js';

describe('BranchServicesService - findBranchServices', () => {
    let service: ReturnType<
        typeof createBranchServicesServiceTestContext
    >['service'];

    let prismaMock: ReturnType<
        typeof createBranchServicesServiceTestContext
    >['prismaMock'];

    const branchId = 'a1b2c3d4-e5f6-4789-8123-456789abcdef';

    const consultationServiceId = 'b2c3d4e5-f6a7-4890-9234-56789abcdef0';
    const vaccinationServiceId = 'c3d4e5f6-a7b8-4901-a345-6789abcdef01';

    const consultationAssignmentId = 'd4e5f6a7-b8c9-4012-b456-789abcdef012';
    const vaccinationAssignmentId = 'e5f6a7b8-c9d0-4123-8567-89abcdef0123';

    const consultationCategoryId = 'f6a7b8c9-d0e1-4234-9678-9abcdef01234';
    const vaccinationCategoryId = 'a7b8c9d0-e1f2-4345-a789-bcdef0123456';

    const consultationPriceId = 'b8c9d0e1-f2a3-4456-8789-cdef01234567';
    const vaccinationPriceId = 'c9d0e1f2-a3b4-4567-989a-def012345678';

    const createdAt = new Date('2026-01-15T10:00:00.000Z');
    const updatedAt = new Date('2026-01-15T10:00:00.000Z');
    const priceValidFrom = new Date('2026-01-15T10:00:00.000Z');

    const branch = {
        idBranch: branchId,
    };

    const branchServices = [
        {
            idBranchService: consultationAssignmentId,
            branchId,
            serviceId: consultationServiceId,
            isActive: true,
            createdAt,
            updatedAt,
            service: {
                idService: consultationServiceId,
                name: 'Consulta veterinaria general',
                isActive: true,
                isPublished: true,
                categoryId: consultationCategoryId,
                category: {
                    idServiceCategory: consultationCategoryId,
                    name: 'Consultas',
                    isActive: true,
                },
            },
            prices: [
                {
                    idBranchServicePrice: consultationPriceId,
                    branchServiceId: consultationAssignmentId,
                    amount: '85000.00',
                    validFrom: priceValidFrom,
                    validUntil: null,
                    createdAt,
                },
            ],
        },
        {
            idBranchService: vaccinationAssignmentId,
            branchId,
            serviceId: vaccinationServiceId,
            isActive: false,
            createdAt,
            updatedAt,
            service: {
                idService: vaccinationServiceId,
                name: 'Vacunación antirrábica',
                isActive: true,
                isPublished: true,
                categoryId: vaccinationCategoryId,
                category: {
                    idServiceCategory: vaccinationCategoryId,
                    name: 'Vacunaciones',
                    isActive: true,
                },
            },
            prices: [
                {
                    idBranchServicePrice: vaccinationPriceId,
                    branchServiceId: vaccinationAssignmentId,
                    amount: '45000.00',
                    validFrom: priceValidFrom,
                    validUntil: null,
                    createdAt,
                },
            ],
        },
    ];

    beforeEach(() => {
        ({ service, prismaMock } = createBranchServicesServiceTestContext());
    });

    it('should return all branch service assignments with their services, categories and current prices', async () => {
        prismaMock.client.branch.findUnique.mockResolvedValue(branch);
        prismaMock.client.branchService.findMany.mockResolvedValue(
            branchServices,
        );

        const result = await service.findBranchServices(branchId);

        expect(result).toEqual(branchServices);
        expect(result).toHaveLength(2);

        expect(result[0].isActive).toBe(true);
        expect(result[1].isActive).toBe(false);

        expect(result[0].service.name).toBe(
            'Consulta veterinaria general',
        );
        expect(result[0].service.category.name).toBe('Consultas');
        expect(result[0].prices[0].amount).toBe('85000.00');

        expect(result[1].service.name).toBe(
            'Vacunación antirrábica',
        );
        expect(result[1].service.category.name).toBe('Vacunaciones');
        expect(result[1].prices[0].amount).toBe('45000.00');

        expect(prismaMock.client.branch.findUnique).toHaveBeenCalledWith({
            where: {
                idBranch: branchId,
            },
            select: {
                idBranch: true,
            },
        });

        expect(prismaMock.client.branchService.findMany).toHaveBeenCalledWith({
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
    });

    it('should throw NotFoundException when the branch does not exist', async () => {
        prismaMock.client.branch.findUnique.mockResolvedValue(null);

        await expect(
            service.findBranchServices(branchId),
        ).rejects.toThrow(NotFoundException);

        expect(prismaMock.client.branchService.findMany).not.toHaveBeenCalled();
    });

    it('should return an empty array when the branch has no assigned services', async () => {
        prismaMock.client.branch.findUnique.mockResolvedValue(branch);
        prismaMock.client.branchService.findMany.mockResolvedValue([]);

        const result = await service.findBranchServices(branchId);

        expect(result).toEqual([]);

        expect(prismaMock.client.branchService.findMany).toHaveBeenCalledWith({
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
    });

    it('should include assignments without a current price', async () => {
        const assignmentWithoutPrice = {
            ...branchServices[0],
            prices: [],
        };

        prismaMock.client.branch.findUnique.mockResolvedValue(branch);
        prismaMock.client.branchService.findMany.mockResolvedValue([
            assignmentWithoutPrice,
        ]);

        const result = await service.findBranchServices(branchId);

        expect(result).toEqual([assignmentWithoutPrice]);
        expect(result[0].prices).toEqual([]);
    });

    it('should rethrow unexpected database errors when searching for the branch', async () => {
        const databaseError = new Error('Database connection failed');

        prismaMock.client.branch.findUnique.mockRejectedValue(databaseError);

        await expect(
            service.findBranchServices(branchId),
        ).rejects.toThrow(databaseError);

        expect(prismaMock.client.branchService.findMany).not.toHaveBeenCalled();
    });

    it('should rethrow unexpected database errors when searching for branch services', async () => {
        const databaseError = new Error('Database query failed');

        prismaMock.client.branch.findUnique.mockResolvedValue(branch);
        prismaMock.client.branchService.findMany.mockRejectedValue(databaseError);

        await expect(
            service.findBranchServices(branchId),
        ).rejects.toThrow(databaseError);
    });
});