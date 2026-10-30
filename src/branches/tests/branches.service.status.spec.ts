
import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BranchesService } from '../branches.service.js';
import { createBranchesServiceMock } from './branches-test.utils.js';

describe('BranchesService - updateBranchStatus', () => {
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

    it('should deactivate a branch successfully', async () => {
        const expectedBranch = {
            idBranch: 'branch-uuid',
            name: 'Convetaruba Medellín',
            isActive: false,
        };

        prismaServiceMock.client.branch.findUnique.mockResolvedValue({
            idBranch: 'branch-uuid',
        });

        prismaServiceMock.client.branch.update.mockResolvedValue(
            expectedBranch,
        );

        const result = await branchesService.updateBranchStatus(
            'branch-uuid',
            false,
        );

        expect(result).toEqual(expectedBranch);

        expect(
            prismaServiceMock.client.branch.update,
        ).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    idBranch: 'branch-uuid',
                },
                data: {
                    isActive: false,
                },
            }),
        );
    });

    it('should activate a branch successfully', async () => {
        const expectedBranch = {
            idBranch: 'branch-uuid',
            name: 'Convetaruba Medellín',
            isActive: true,
        };

        prismaServiceMock.client.branch.findUnique.mockResolvedValue({
            idBranch: 'branch-uuid',
        });

        prismaServiceMock.client.branch.update.mockResolvedValue(
            expectedBranch,
        );

        const result = await branchesService.updateBranchStatus(
            'branch-uuid',
            true,
        );

        expect(result).toEqual(expectedBranch);

        expect(
            prismaServiceMock.client.branch.update,
        ).toHaveBeenCalledWith(
            expect.objectContaining({
                data: {
                    isActive: true,
                },
            }),
        );
    });

    it('should throw NotFoundException when the branch does not exist', async () => {
        prismaServiceMock.client.branch.findUnique.mockResolvedValue(null);

        await expect(
            branchesService.updateBranchStatus('unknown-uuid', false),
        ).rejects.toThrow(NotFoundException);

        expect(
            prismaServiceMock.client.branch.update,
        ).not.toHaveBeenCalled();
    });

    it('should propagate unexpected database errors', async () => {
        const databaseError = new Error('Database connection failed');

        prismaServiceMock.client.branch.findUnique.mockResolvedValue({
            idBranch: 'branch-uuid',
        });

        prismaServiceMock.client.branch.update.mockRejectedValue(
            databaseError,
        );

        await expect(
            branchesService.updateBranchStatus('branch-uuid', false),
        ).rejects.toThrow(databaseError);
    });
});