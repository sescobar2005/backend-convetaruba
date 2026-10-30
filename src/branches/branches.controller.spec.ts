
import { ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';


import { BranchesService } from './branches.service.js';
import { BranchesController } from './branches.controller.js';
import { createBranchesServiceMock } from './tests/branches-test.utils.js';

describe('BranchesController', () => {
    let branchesController: BranchesController;
    let branchesServiceMock: {
        createBranch: ReturnType<typeof vi.fn>;
        findAllBranches: ReturnType<typeof vi.fn>;
        findBranchById: ReturnType<typeof vi.fn>;
        updateBranch: ReturnType<typeof vi.fn>;
        updateBranchStatus: ReturnType<typeof vi.fn>;
    };

    const adminRequest = {
        user: {
            sub: 'admin-uuid',
            role: 'ADMIN',
            tokenVersion: 0,
        },
    };

    beforeEach(() => {
        vi.clearAllMocks();

        branchesServiceMock = {
            createBranch: vi.fn(),
            findAllBranches: vi.fn(),
            findBranchById: vi.fn(),
            updateBranch: vi.fn(),
            updateBranchStatus: vi.fn(),
        };

        branchesController = new BranchesController(
            branchesServiceMock as unknown as BranchesService,
        );
    });

    it('should create a branch successfully', async () => {
        const createBranchDto = {
            name: 'Convetaruba Medellín',
            slug: 'convetaruba-medellin',
            address: 'Calle 10 # 20-30',
            city: 'Medellín',
            department: 'Antioquia',
        };

        const expectedBranch = {
            idBranch: 'branch-uuid',
            ...createBranchDto,
            isActive: true,
        };

        branchesServiceMock.createBranch.mockResolvedValue(expectedBranch);

        const result = await branchesController.createBranch(
            adminRequest as never,
            createBranchDto,
        );

        expect(result).toEqual(expectedBranch);
        expect(branchesServiceMock.createBranch).toHaveBeenCalledWith(
            createBranchDto,
        );
    });

    it('should return all branches', async () => {
        const expectedBranches = [
            {
                idBranch: 'branch-uuid',
                name: 'Convetaruba Medellín',
                isActive: true,
            },
        ];

        branchesServiceMock.findAllBranches.mockResolvedValue(
            expectedBranches,
        );

        const result = await branchesController.findAllBranches(
            adminRequest as never,
        );

        expect(result).toEqual(expectedBranches);
        expect(branchesServiceMock.findAllBranches).toHaveBeenCalledOnce();
    });

    it('should return a branch by ID', async () => {
        const expectedBranch = {
            idBranch: 'branch-uuid',
            name: 'Convetaruba Medellín',
        };

        branchesServiceMock.findBranchById.mockResolvedValue(expectedBranch);

        const result = await branchesController.findBranchById(
            adminRequest as never,
            'branch-uuid',
        );

        expect(result).toEqual(expectedBranch);
        expect(branchesServiceMock.findBranchById).toHaveBeenCalledWith(
            'branch-uuid',
        );
    });

    it('should update a branch successfully', async () => {
        const updateBranchDto = {
            name: 'Convetaruba Medellín Updated',
        };

        const expectedBranch = {
            idBranch: 'branch-uuid',
            ...updateBranchDto,
        };

        branchesServiceMock.updateBranch.mockResolvedValue(expectedBranch);

        const result = await branchesController.updateBranch(
            adminRequest as never,
            'branch-uuid',
            updateBranchDto,
        );

        expect(result).toEqual(expectedBranch);
        expect(branchesServiceMock.updateBranch).toHaveBeenCalledWith(
            'branch-uuid',
            updateBranchDto,
        );
    });

    it('should update a branch status successfully', async () => {
        const updateBranchStatusDto = {
            isActive: false,
        };

        const expectedBranch = {
            idBranch: 'branch-uuid',
            isActive: false,
        };

        branchesServiceMock.updateBranchStatus.mockResolvedValue(
            expectedBranch,
        );

        const result = await branchesController.updateBranchStatus(
            adminRequest as never,
            'branch-uuid',
            updateBranchStatusDto,
        );

        expect(result).toEqual(expectedBranch);
        expect(branchesServiceMock.updateBranchStatus).toHaveBeenCalledWith(
            'branch-uuid',
            false,
        );
    });

    it.each(['STAFF', 'CUSTOMER'] as const)(
        'should throw ForbiddenException when the user role is %s',
        async (role) => {
            const unauthorizedRequest = {
                user: {
                    sub: 'user-uuid',
                    role,
                    tokenVersion: 0,
                },
            };

            await expect(
                branchesController.findAllBranches(
                    unauthorizedRequest as never,
                ),
            ).rejects.toThrow(ForbiddenException);

            expect(
                branchesServiceMock.findAllBranches,
            ).not.toHaveBeenCalled();
        },
    );
});