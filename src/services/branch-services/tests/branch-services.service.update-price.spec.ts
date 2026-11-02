import {
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import { createBranchServicesServiceTestContext } from './branch-services-test.utils.js';
import { Prisma } from '../../../../generated/prisma/browser.js';

describe('BranchServicesService - updateBranchServicePrice', () => {
    let service: ReturnType<
        typeof createBranchServicesServiceTestContext
    >['service'];

    let prismaMock: ReturnType<
        typeof createBranchServicesServiceTestContext
    >['prismaMock'];

    let transactionMock: ReturnType<
        typeof createBranchServicesServiceTestContext
    >['transactionMock'];

    const branchId = 'a1b2c3d4-e5f6-4789-8123-456789abcdef';
    const branchServiceId = 'c3d4e5f6-a7b8-4901-a345-6789abcdef01';

    const currentPriceId = 'd4e5f6a7-b8c9-4012-b456-789abcdef012';
    const newPriceId = 'e5f6a7b8-c9d0-4123-8567-89abcdef0123';

    const fixedNow = new Date('2026-06-15T10:00:00.000Z');
    const previousValidFrom = new Date('2026-01-15T10:00:00.000Z');

    const currentAmount = new Prisma.Decimal('85000.00');
    const newAmount = new Prisma.Decimal('95000.00');

    const activeBranchService = {
        idBranchService: branchServiceId,
        branchId,
        isActive: true,
    };

    const currentPrice = {
        idBranchServicePrice: currentPriceId,
        branchServiceId,
        amount: currentAmount,
        validFrom: previousValidFrom,
        validUntil: null,
        createdAt: previousValidFrom,
    };

    const createdPrice = {
        idBranchServicePrice: newPriceId,
        branchServiceId,
        amount: newAmount,
        validFrom: fixedNow,
        validUntil: null,
        createdAt: fixedNow,
    };

    const updatePriceDto = {
        amount: 95000,
    };

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(fixedNow);

        ({
            service,
            prismaMock,
            transactionMock,
        } = createBranchServicesServiceTestContext());
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should create a new price and close the previous price', async () => {
        prismaMock.client.branchService.findUnique.mockResolvedValue(
            activeBranchService,
        );

        transactionMock.branchServicePrice.findFirst.mockResolvedValue(
            currentPrice,
        );

        transactionMock.branchServicePrice.update.mockResolvedValue({
            ...currentPrice,
            validUntil: fixedNow,
        });

        transactionMock.branchServicePrice.create.mockResolvedValue(
            createdPrice,
        );

        const result = await service.updateBranchServicePrice(
            branchId,
            branchServiceId,
            updatePriceDto,
        );

        expect(result).toEqual(createdPrice);

        expect(prismaMock.client.branchService.findUnique).toHaveBeenCalledWith({
            where: {
                idBranchService: branchServiceId,
            },
            select: {
                idBranchService: true,
                branchId: true,
                isActive: true,
            },
        });

        expect(prismaMock.client.$transaction).toHaveBeenCalledTimes(1);

        expect(transactionMock.branchServicePrice.findFirst).toHaveBeenCalledWith({
            where: {
                branchServiceId,
                validUntil: null,
            },
            orderBy: {
                validFrom: 'desc',
            },
        });

        expect(transactionMock.branchServicePrice.update).toHaveBeenCalledWith({
            where: {
                idBranchServicePrice: currentPriceId,
            },
            data: {
                validUntil: fixedNow,
            },
        });

        expect(transactionMock.branchServicePrice.create).toHaveBeenCalledWith({
            data: {
                branchServiceId,
                amount: updatePriceDto.amount,
                validFrom: fixedNow,
            },
        });
    });

    it('should create the first price when no previous price exists', async () => {
        prismaMock.client.branchService.findUnique.mockResolvedValue(
            activeBranchService,
        );

        transactionMock.branchServicePrice.findFirst.mockResolvedValue(null);
        transactionMock.branchServicePrice.create.mockResolvedValue(
            createdPrice,
        );

        const result = await service.updateBranchServicePrice(
            branchId,
            branchServiceId,
            updatePriceDto,
        );

        expect(result).toEqual(createdPrice);

        expect(transactionMock.branchServicePrice.update).not.toHaveBeenCalled();

        expect(transactionMock.branchServicePrice.create).toHaveBeenCalledWith({
            data: {
                branchServiceId,
                amount: updatePriceDto.amount,
                validFrom: fixedNow,
            },
        });
    });

    it('should throw NotFoundException when the branch service assignment does not exist', async () => {
        prismaMock.client.branchService.findUnique.mockResolvedValue(null);

        await expect(
            service.updateBranchServicePrice(
                branchId,
                branchServiceId,
                updatePriceDto,
            ),
        ).rejects.toThrow(NotFoundException);

        expect(prismaMock.client.$transaction).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when the assignment belongs to another branch', async () => {
        const anotherBranchId = 'f6a7b8c9-d0e1-4234-9678-9abcdef01234';

        prismaMock.client.branchService.findUnique.mockResolvedValue({
            ...activeBranchService,
            branchId: anotherBranchId,
        });

        await expect(
            service.updateBranchServicePrice(
                branchId,
                branchServiceId,
                updatePriceDto,
            ),
        ).rejects.toThrow(NotFoundException);

        expect(prismaMock.client.$transaction).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when the branch service assignment is inactive', async () => {
        prismaMock.client.branchService.findUnique.mockResolvedValue({
            ...activeBranchService,
            isActive: false,
        });

        await expect(
            service.updateBranchServicePrice(
                branchId,
                branchServiceId,
                updatePriceDto,
            ),
        ).rejects.toThrow(
            'Cannot update the price of an inactive branch service',
        );

        expect(prismaMock.client.$transaction).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when the new price equals the current price', async () => {
        prismaMock.client.branchService.findUnique.mockResolvedValue(
            activeBranchService,
        );

        transactionMock.branchServicePrice.findFirst.mockResolvedValue(
            currentPrice,
        );

        await expect(
            service.updateBranchServicePrice(
                branchId,
                branchServiceId,
                { amount: 85000 },
            ),
        ).rejects.toThrow(
            'The new price must be different from the current price',
        );

        expect(transactionMock.branchServicePrice.update).not.toHaveBeenCalled();
        expect(transactionMock.branchServicePrice.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when the current price starts at the current time', async () => {
        prismaMock.client.branchService.findUnique.mockResolvedValue(
            activeBranchService,
        );

        transactionMock.branchServicePrice.findFirst.mockResolvedValue({
            ...currentPrice,
            validFrom: fixedNow,
        });

        await expect(
            service.updateBranchServicePrice(
                branchId,
                branchServiceId,
                updatePriceDto,
            ),
        ).rejects.toThrow(
            'The current price cannot be closed before its start date',
        );

        expect(transactionMock.branchServicePrice.update).not.toHaveBeenCalled();
        expect(transactionMock.branchServicePrice.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when the current price starts after the current time', async () => {
        const futureValidFrom = new Date('2026-07-15T10:00:00.000Z');

        prismaMock.client.branchService.findUnique.mockResolvedValue(
            activeBranchService,
        );

        transactionMock.branchServicePrice.findFirst.mockResolvedValue({
            ...currentPrice,
            validFrom: futureValidFrom,
        });

        await expect(
            service.updateBranchServicePrice(
                branchId,
                branchServiceId,
                updatePriceDto,
            ),
        ).rejects.toThrow(
            'The current price cannot be closed before its start date',
        );

        expect(transactionMock.branchServicePrice.update).not.toHaveBeenCalled();
        expect(transactionMock.branchServicePrice.create).not.toHaveBeenCalled();
    });

    it('should propagate unexpected database errors from the transaction', async () => {
        const databaseError = new Error('Price history transaction failed');

        prismaMock.client.branchService.findUnique.mockResolvedValue(
            activeBranchService,
        );

        transactionMock.branchServicePrice.findFirst.mockRejectedValue(
            databaseError,
        );

        await expect(
            service.updateBranchServicePrice(
                branchId,
                branchServiceId,
                updatePriceDto,
            ),
        ).rejects.toThrow(databaseError);

        expect(transactionMock.branchServicePrice.create).not.toHaveBeenCalled();
    });
});