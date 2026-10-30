
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BranchesService } from '../branches.service.js';
import { createBranchesServiceMock } from './branches-test.utils.js';

describe('BranchesService - findAllBranches', () => {
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

    it('should return all branches ordered by creation date', async () => {
        const expectedBranches = [
            {
                idBranch: 'branch-uuid-1',
                name: 'Convetaruba Medellín',
                isActive: true,
            },
            {
                idBranch: 'branch-uuid-2',
                name: 'Convetaruba Envigado',
                isActive: false,
            },
        ];

        prismaServiceMock.client.branch.findMany.mockResolvedValue(
            expectedBranches,
        );

        const result = await branchesService.findAllBranches();

        expect(result).toEqual(expectedBranches);

        expect(
            prismaServiceMock.client.branch.findMany,
        ).toHaveBeenCalledWith({
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
    });

    it('should return an empty array when no branches exist', async () => {
        prismaServiceMock.client.branch.findMany.mockResolvedValue([]);

        const result = await branchesService.findAllBranches();

        expect(result).toEqual([]);
    });

    it('should propagate unexpected database errors', async () => {
        const databaseError = new Error('Database connection failed');

        prismaServiceMock.client.branch.findMany.mockRejectedValue(
            databaseError,
        );

        await expect(
            branchesService.findAllBranches(),
        ).rejects.toThrow(databaseError);
    });
});