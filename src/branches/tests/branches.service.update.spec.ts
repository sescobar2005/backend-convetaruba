
import {
    BadRequestException,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BranchesService } from '../branches.service.js';
import { UpdateBranchDto } from '../dto/update-branch.dto.js';
import { createBranchesServiceMock } from './branches-test.utils.js';

describe('BranchesService - updateBranch', () => {
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

    it('should update a branch successfully', async () => {
        const updateBranchDto: UpdateBranchDto = {
            name: 'Convetaruba Medellín Updated',
            address: 'Carrera 50 # 20-30',
        };

        const expectedBranch = {
            idBranch: 'branch-uuid',
            ...updateBranchDto,
            slug: 'convetaruba-medellin',
            city: 'Medellín',
            department: 'Antioquia',
            phone: null,
            email: null,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        prismaServiceMock.client.branch.findUnique.mockResolvedValue({
            idBranch: 'branch-uuid',
        });

        prismaServiceMock.client.branch.update.mockResolvedValue(
            expectedBranch,
        );

        const result = await branchesService.updateBranch(
            'branch-uuid',
            updateBranchDto,
        );

        expect(result).toEqual(expectedBranch);
        expect(
            prismaServiceMock.client.branch.update,
        ).toHaveBeenCalledOnce();
    });

    it('should normalize the slug when updating it', async () => {
        const updateBranchDto: UpdateBranchDto = {
            slug: ' Clínica Medellín ',
        };

        prismaServiceMock.client.branch.findUnique.mockResolvedValue({
            idBranch: 'branch-uuid',
        });

        prismaServiceMock.client.branch.update.mockResolvedValue({});

        await branchesService.updateBranch(
            'branch-uuid',
            updateBranchDto,
        );

        expect(
            prismaServiceMock.client.branch.update,
        ).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    slug: 'clinica-medellin',
                }),
            }),
        );
    });

    it('should throw NotFoundException when the branch does not exist', async () => {
        prismaServiceMock.client.branch.findUnique.mockResolvedValue(null);

        await expect(
            branchesService.updateBranch('unknown-uuid', {
                name: 'Updated branch',
            }),
        ).rejects.toThrow(NotFoundException);

        expect(
            prismaServiceMock.client.branch.update,
        ).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when the DTO is empty', async () => {
        prismaServiceMock.client.branch.findUnique.mockResolvedValue({
            idBranch: 'branch-uuid',
        });

        await expect(
            branchesService.updateBranch('branch-uuid', {}),
        ).rejects.toThrow(BadRequestException);

        expect(
            prismaServiceMock.client.branch.update,
        ).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when the slug already exists', async () => {
        prismaServiceMock.client.branch.findUnique.mockResolvedValue({
            idBranch: 'branch-uuid',
        });

        prismaServiceMock.client.branch.update.mockRejectedValue({
            code: 'P2002',
        });

        await expect(
            branchesService.updateBranch('branch-uuid', {
                slug: 'existing-branch',
            }),
        ).rejects.toThrow(ConflictException);
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
            branchesService.updateBranch('branch-uuid', {
                name: 'Updated branch',
            }),
        ).rejects.toThrow(databaseError);
    });
});