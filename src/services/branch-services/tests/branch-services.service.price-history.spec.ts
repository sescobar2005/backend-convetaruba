import { NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../../generated/prisma/client.js';
import {
    beforeEach,
    describe,
    expect,
    it,
} from 'vitest';

import { createBranchServicesServiceTestContext } from './branch-services-test.utils.js';

describe('BranchServicesService - findBranchServicePriceHistory', () => {
    let service: ReturnType<
        typeof createBranchServicesServiceTestContext
    >['service'];

    let prismaMock: ReturnType<
        typeof createBranchServicesServiceTestContext
    >['prismaMock'];

    const branchId = 'a1b2c3d4-e5f6-4789-8123-456789abcdef';
    const branchServiceId = 'c3d4e5f6-a7b8-4901-a345-6789abcdef01';

    const firstPriceId = 'd4e5f6a7-b8c9-4012-b456-789abcdef012';
    const secondPriceId = 'e5f6a7b8-c9d0-4123-8567-89abcdef0123';
    const thirdPriceId = 'f6a7b8c9-d0e1-4234-9678-9abcdef01234';

    const createdAt = new Date('2026-01-15T10:00:00.000Z');

    const firstValidFrom = new Date('2026-01-15T10:00:00.000Z');
    const firstValidUntil = new Date('2026-03-01T10:00:00.000Z');

    const secondValidFrom = new Date('2026-03-01T10:00:00.000Z');
    const secondValidUntil = new Date('2026-06-01T10:00:00.000Z');

    const thirdValidFrom = new Date('2026-06-01T10:00:00.000Z');

    const branchService = {
        idBranchService: branchServiceId,
        branchId,
    };

    const priceHistory = [
        {
            idBranchServicePrice: thirdPriceId,
            branchServiceId,
            amount: new Prisma.Decimal('95000.00'),
            validFrom: thirdValidFrom,
            validUntil: null,
            createdAt: thirdValidFrom,
        },
        {
            idBranchServicePrice: secondPriceId,
            branchServiceId,
            amount: new Prisma.Decimal('90000.00'),
            validFrom: secondValidFrom,
            validUntil: secondValidUntil,
            createdAt,
        },
        {
            idBranchServicePrice: firstPriceId,
            branchServiceId,
            amount: new Prisma.Decimal('85000.00'),
            validFrom: firstValidFrom,
            validUntil: firstValidUntil,
            createdAt,
        },
    ];

    beforeEach(() => {
        ({ service, prismaMock } = createBranchServicesServiceTestContext());
    });

    it('should return the complete price history ordered by start date descending', async () => {
        prismaMock.client.branchService.findUnique.mockResolvedValue(
            branchService,
        );

        prismaMock.client.branchServicePrice.findMany.mockResolvedValue(
            priceHistory,
        );

        const result = await service.findBranchServicePriceHistory(
            branchId,
            branchServiceId,
        );

        expect(result).toEqual(priceHistory);
        expect(result).toHaveLength(3);

        expect(result[0].amount.equals('95000.00')).toBe(true);
        expect(result[0].validUntil).toBeNull();

        expect(result[1].amount.equals('90000.00')).toBe(true);
        expect(result[1].validUntil).toEqual(secondValidUntil);

        expect(result[2].amount.equals('85000.00')).toBe(true);
        expect(result[2].validUntil).toEqual(firstValidUntil);

        expect(prismaMock.client.branchService.findUnique).toHaveBeenCalledWith({
            where: {
                idBranchService: branchServiceId,
            },
            select: {
                idBranchService: true,
                branchId: true,
            },
        });

        expect(prismaMock.client.branchServicePrice.findMany).toHaveBeenCalledWith({
            where: {
                branchServiceId,
            },
            orderBy: {
                validFrom: 'desc',
            },
        });
    });

    it('should throw NotFoundException when the branch service assignment does not exist', async () => {
        prismaMock.client.branchService.findUnique.mockResolvedValue(null);

        await expect(
            service.findBranchServicePriceHistory(
                branchId,
                branchServiceId,
            ),
        ).rejects.toThrow(NotFoundException);

        expect(prismaMock.client.branchServicePrice.findMany).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when the assignment belongs to another branch', async () => {
        const anotherBranchId = 'a7b8c9d0-e1f2-4345-a789-bcdef0123456';

        prismaMock.client.branchService.findUnique.mockResolvedValue({
            ...branchService,
            branchId: anotherBranchId,
        });

        await expect(
            service.findBranchServicePriceHistory(
                branchId,
                branchServiceId,
            ),
        ).rejects.toThrow(NotFoundException);

        expect(prismaMock.client.branchServicePrice.findMany).not.toHaveBeenCalled();
    });

    it('should return an empty array when the assignment has no price history', async () => {
        prismaMock.client.branchService.findUnique.mockResolvedValue(
            branchService,
        );

        prismaMock.client.branchServicePrice.findMany.mockResolvedValue([]);

        const result = await service.findBranchServicePriceHistory(
            branchId,
            branchServiceId,
        );

        expect(result).toEqual([]);

        expect(prismaMock.client.branchServicePrice.findMany).toHaveBeenCalledWith({
            where: {
                branchServiceId,
            },
            orderBy: {
                validFrom: 'desc',
            },
        });
    });

    it('should rethrow unexpected database errors when searching for the assignment', async () => {
        const databaseError = new Error('Database connection failed');

        prismaMock.client.branchService.findUnique.mockRejectedValue(
            databaseError,
        );

        await expect(
            service.findBranchServicePriceHistory(
                branchId,
                branchServiceId,
            ),
        ).rejects.toThrow(databaseError);

        expect(prismaMock.client.branchServicePrice.findMany).not.toHaveBeenCalled();
    });

    it('should rethrow unexpected database errors when searching for price history', async () => {
        const databaseError = new Error('Price history query failed');

        prismaMock.client.branchService.findUnique.mockResolvedValue(
            branchService,
        );

        prismaMock.client.branchServicePrice.findMany.mockRejectedValue(
            databaseError,
        );

        await expect(
            service.findBranchServicePriceHistory(
                branchId,
                branchServiceId,
            ),
        ).rejects.toThrow(databaseError);
    });
});