
import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BranchesService } from '../branches.service.js';
import { createBranchesServiceMock } from './branches-test.utils.js';

describe('BranchesService - findBranchById', () => {
    let branchesService: BranchesService;
    let prismaServiceMock: ReturnType<
        typeof createBranchesServiceMock
    >['prismaServiceMock'];

    beforeEach(() => {
        vi.clearAllMocks();

        const mocks = createBranchesServiceMock();

        branchesService = mocks.branchesService;
        prismaServiceMock = mocks.prismaServiceMock;
    });

    it('should return a branch when it exists', async () => {
        const expectedBranch = {
            idBranch: 'branch-uuid',
            name: 'Convetaruba Medellín',
            slug: 'convetaruba-medellin',
            address: 'Calle 10 # 20-30',
            city: 'Medellín',
            department: 'Antioquia',
            phone: '3001234567',
            email: 'medellin@convetaruba.com',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        prismaServiceMock.client.branch.findUnique.mockResolvedValue(
            expectedBranch,
        );

        const result = await branchesService.findBranchById('branch-uuid');

        expect(result).toEqual(expectedBranch);

        expect(
            prismaServiceMock.client.branch.findUnique,
        ).toHaveBeenCalledWith({
            where: {
                idBranch: 'branch-uuid',
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
    });

    it('should throw NotFoundException when the branch does not exist', async () => {
        prismaServiceMock.client.branch.findUnique.mockResolvedValue(null);

        await expect(
            branchesService.findBranchById('unknown-uuid'),
        ).rejects.toThrow(NotFoundException);
    });

    it('should propagate unexpected database errors', async () => {
        const databaseError = new Error('Database connection failed');

        prismaServiceMock.client.branch.findUnique.mockRejectedValue(
            databaseError,
        );

        await expect(
            branchesService.findBranchById('branch-uuid'),
        ).rejects.toThrow(databaseError);
    });
});