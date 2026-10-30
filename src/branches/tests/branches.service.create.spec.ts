
import { ConflictException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BranchesService } from '../branches.service.js';
import { CreateBranchDto } from '../dto/create-branch.dto.js';
import { createBranchesServiceMock } from './branches-test.utils.js';

describe('BranchesService - createBranch', () => {
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

    it('should create a branch successfully', async () => {
        const createBranchDto: CreateBranchDto = {
            name: 'Convetaruba Medellín',
            slug: 'convetaruba-medellin',
            address: 'Calle 10 # 20-30',
            city: 'Medellín',
            department: 'Antioquia',
            phone: '3001234567',
            email: 'medellin@convetaruba.com',
        };

        const expectedBranch = {
            idBranch: 'branch-uuid',
            ...createBranchDto,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        prismaServiceMock.client.branch.create.mockResolvedValue(
            expectedBranch,
        );

        const result = await branchesService.createBranch(createBranchDto);

        expect(result).toEqual(expectedBranch);
        expect(prismaServiceMock.client.branch.create).toHaveBeenCalledOnce();
    });

    it('should normalize the branch slug before creating it', async () => {
        const createBranchDto: CreateBranchDto = {
            name: 'Convetaruba Medellín',
            slug: '  Clínica Medellín  ',
            address: 'Calle 10 # 20-30',
            city: 'Medellín',
            department: 'Antioquia',
        };

        prismaServiceMock.client.branch.create.mockResolvedValue({});

        await branchesService.createBranch(createBranchDto);

        expect(
            prismaServiceMock.client.branch.create,
        ).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    slug: 'clinica-medellin',
                }),
            }),
        );
    });

    it('should throw ConflictException when the branch slug already exists', async () => {
        const createBranchDto: CreateBranchDto = {
            name: 'Convetaruba Medellín',
            slug: 'convetaruba-medellin',
            address: 'Calle 10 # 20-30',
            city: 'Medellín',
            department: 'Antioquia',
        };

        prismaServiceMock.client.branch.create.mockRejectedValue({
            code: 'P2002',
        });

        await expect(
            branchesService.createBranch(createBranchDto),
        ).rejects.toThrow(ConflictException);
    });

    it('should propagate unexpected database errors', async () => {
        const createBranchDto: CreateBranchDto = {
            name: 'Convetaruba Medellín',
            slug: 'convetaruba-medellin',
            address: 'Calle 10 # 20-30',
            city: 'Medellín',
            department: 'Antioquia',
        };

        const databaseError = new Error('Database connection failed');

        prismaServiceMock.client.branch.create.mockRejectedValue(
            databaseError,
        );

        await expect(
            branchesService.createBranch(createBranchDto),
        ).rejects.toThrow(databaseError);
    });
});