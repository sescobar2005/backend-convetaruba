import { NotFoundException } from '@nestjs/common';
import {
    beforeEach,
    describe,
    expect,
    it,
} from 'vitest';

import { createBranchServicesServiceTestContext } from './branch-services-test.utils.js';

describe('BranchServicesService - findServiceBranches', () => {
    let service: ReturnType<
        typeof createBranchServicesServiceTestContext
    >['service'];

    let prismaMock: ReturnType<
        typeof createBranchServicesServiceTestContext
    >['prismaMock'];

    const serviceId = 'b2c3d4e5-f6a7-4890-9234-56789abcdef0';

    const branchId = 'a1b2c3d4-e5f6-4789-8123-456789abcdef';
    const secondBranchId = 'd4e5f6a7-b8c9-4012-b456-789abcdef012';

    const branchServiceId = 'e5f6a7b8-c9d0-4123-8567-89abcdef0123';
    const secondBranchServiceId = 'f6a7b8c9-d0e1-4234-9678-9abcdef01234';

    const priceId = 'a7b8c9d0-e1f2-4345-a789-bcdef0123456';
    const secondPriceId = 'b8c9d0e1-f2a3-4456-8789-cdef01234567';

    const createdAt = new Date('2026-01-15T10:00:00.000Z');
    const updatedAt = new Date('2026-01-15T10:00:00.000Z');
    const priceValidFrom = new Date('2026-01-15T10:00:00.000Z');

    const catalogService = {
        idService: serviceId,
    };

    const serviceBranches = [
        {
            idBranchService: branchServiceId,
            branchId,
            serviceId,
            isActive: true,
            createdAt,
            updatedAt,
            branch: {
                idBranch: branchId,
                name: 'Convetaruba Savaneta',
                slug: 'convetaruba-savaneta',
                address: 'Savaneta, Aruba',
                city: 'Savaneta',
                department: 'Aruba',
                phone: null,
                email: null,
                isActive: true,
                createdAt,
                updatedAt,
            },
            prices: [
                {
                    idBranchServicePrice: priceId,
                    branchServiceId,
                    amount: '85000.00',
                    validFrom: priceValidFrom,
                    validUntil: null,
                    createdAt,
                },
            ],
        },
        {
            idBranchService: secondBranchServiceId,
            branchId: secondBranchId,
            serviceId,
            isActive: false,
            createdAt,
            updatedAt,
            branch: {
                idBranch: secondBranchId,
                name: 'Convetaruba Savaneta - Sede secundaria',
                slug: 'convetaruba-savaneta-secundaria',
                address: 'Savaneta, Aruba',
                city: 'Savaneta',
                department: 'Aruba',
                phone: null,
                email: null,
                isActive: true,
                createdAt,
                updatedAt,
            },
            prices: [
                {
                    idBranchServicePrice: secondPriceId,
                    branchServiceId: secondBranchServiceId,
                    amount: '90000.00',
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

    it('should return all branches assigned to the service with their current prices', async () => {
        prismaMock.client.service.findUnique.mockResolvedValue(catalogService);
        prismaMock.client.branchService.findMany.mockResolvedValue(
            serviceBranches,
        );

        const result = await service.findServiceBranches(serviceId);

        expect(result).toEqual(serviceBranches);
        expect(result).toHaveLength(2);

        expect(result[0].isActive).toBe(true);
        expect(result[1].isActive).toBe(false);

        expect(result[0].branch.name).toBe('Convetaruba Savaneta');
        expect(result[0].branch.city).toBe('Savaneta');
        expect(result[0].branch.department).toBe('Aruba');
        expect(result[0].prices[0].amount).toBe('85000.00');

        expect(result[1].branch.name).toBe(
            'Convetaruba Savaneta - Sede secundaria',
        );
        expect(result[1].branch.city).toBe('Savaneta');
        expect(result[1].branch.department).toBe('Aruba');
        expect(result[1].prices[0].amount).toBe('90000.00');

        expect(prismaMock.client.service.findUnique).toHaveBeenCalledWith({
            where: {
                idService: serviceId,
            },
            select: {
                idService: true,
            },
        });

        expect(prismaMock.client.branchService.findMany).toHaveBeenCalledWith({
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
    });

    it('should throw NotFoundException when the service does not exist', async () => {
        prismaMock.client.service.findUnique.mockResolvedValue(null);

        await expect(
            service.findServiceBranches(serviceId),
        ).rejects.toThrow(NotFoundException);

        expect(prismaMock.client.branchService.findMany).not.toHaveBeenCalled();
    });

    it('should return an empty array when the service has no assigned branches', async () => {
        prismaMock.client.service.findUnique.mockResolvedValue(catalogService);
        prismaMock.client.branchService.findMany.mockResolvedValue([]);

        const result = await service.findServiceBranches(serviceId);

        expect(result).toEqual([]);

        expect(prismaMock.client.branchService.findMany).toHaveBeenCalledWith({
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
    });

    it('should include branch assignments without a current price', async () => {
        const branchWithoutPrice = {
            ...serviceBranches[0],
            prices: [],
        };

        prismaMock.client.service.findUnique.mockResolvedValue(catalogService);
        prismaMock.client.branchService.findMany.mockResolvedValue([
            branchWithoutPrice,
        ]);

        const result = await service.findServiceBranches(serviceId);

        expect(result).toEqual([branchWithoutPrice]);
        expect(result[0].prices).toEqual([]);
    });

    it('should rethrow unexpected database errors when searching for the service', async () => {
        const databaseError = new Error('Database connection failed');

        prismaMock.client.service.findUnique.mockRejectedValue(databaseError);

        await expect(
            service.findServiceBranches(serviceId),
        ).rejects.toThrow(databaseError);

        expect(prismaMock.client.branchService.findMany).not.toHaveBeenCalled();
    });

    it('should rethrow unexpected database errors when searching for assigned branches', async () => {
        const databaseError = new Error('Database query failed');

        prismaMock.client.service.findUnique.mockResolvedValue(catalogService);
        prismaMock.client.branchService.findMany.mockRejectedValue(databaseError);

        await expect(
            service.findServiceBranches(serviceId),
        ).rejects.toThrow(databaseError);
    });
});