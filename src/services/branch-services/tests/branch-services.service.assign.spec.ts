import {
    BadRequestException,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import {
    beforeEach,
    describe,
    expect,
    it,
} from 'vitest';

import { createBranchServicesServiceTestContext } from './branch-services-test.utils.js';

describe('BranchServicesService - assignServiceToBranch', () => {
    let service: ReturnType<
        typeof createBranchServicesServiceTestContext
    >['service'];

    let prismaMock: ReturnType<
        typeof createBranchServicesServiceTestContext
    >['prismaMock'];

    const branchId = 'a1b2c3d4-e5f6-4789-8123-456789abcdef';
    const serviceId = 'b2c3d4e5-f6a7-4890-9234-56789abcdef0';
    const branchServiceId = 'c3d4e5f6-a7b8-4901-a345-6789abcdef01';

    const createdAt = new Date('2026-01-15T10:00:00.000Z');
    const updatedAt = new Date('2026-01-15T10:00:00.000Z');

    const branch = {
        idBranch: branchId,
        isActive: true,
    };

    const catalogService = {
        idService: serviceId,
        isActive: true,
        isPublished: true,
    };

    const assignBranchServiceDto = {
        serviceId,
    };

    const createdAssignment = {
        idBranchService: branchServiceId,
        branchId,
        serviceId,
        isActive: true,
        createdAt,
        updatedAt,
        branch: {
            idBranch: branchId,
            isActive: true,
        },
        service: {
            idService: serviceId,
            isActive: true,
            isPublished: true,
        },
    };

    beforeEach(() => {
        ({ service, prismaMock } = createBranchServicesServiceTestContext());
    });

    it('should assign an active and published service to an active branch', async () => {
        prismaMock.client.branch.findUnique.mockResolvedValue(branch);
        prismaMock.client.service.findUnique.mockResolvedValue(catalogService);
        prismaMock.client.branchService.findUnique.mockResolvedValue(null);
        prismaMock.client.branchService.create.mockResolvedValue(
            createdAssignment,
        );

        const result = await service.assignServiceToBranch(
            branchId,
            assignBranchServiceDto,
        );

        expect(result).toEqual(createdAssignment);

        expect(prismaMock.client.branch.findUnique).toHaveBeenCalledWith({
            where: {
                idBranch: branchId,
            },
            select: {
                idBranch: true,
                isActive: true,
            },
        });

        expect(prismaMock.client.service.findUnique).toHaveBeenCalledWith({
            where: {
                idService: serviceId,
            },
            select: {
                idService: true,
                isActive: true,
                isPublished: true,
            },
        });

        expect(prismaMock.client.branchService.findUnique).toHaveBeenCalledWith({
            where: {
                branchId_serviceId: {
                    branchId,
                    serviceId,
                },
            },
            select: {
                idBranchService: true,
                isActive: true,
            },
        });

        expect(prismaMock.client.branchService.create).toHaveBeenCalledWith({
            data: {
                branchId,
                serviceId,
            },
            include: {
                service: true,
                branch: true,
            },
        });
    });

    it('should throw NotFoundException when the branch does not exist', async () => {
        prismaMock.client.branch.findUnique.mockResolvedValue(null);

        await expect(
            service.assignServiceToBranch(
                branchId,
                assignBranchServiceDto,
            ),
        ).rejects.toThrow(NotFoundException);

        expect(prismaMock.client.service.findUnique).not.toHaveBeenCalled();
        expect(prismaMock.client.branchService.findUnique).not.toHaveBeenCalled();
        expect(prismaMock.client.branchService.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when the branch is inactive', async () => {
        prismaMock.client.branch.findUnique.mockResolvedValue({
            ...branch,
            isActive: false,
        });

        await expect(
            service.assignServiceToBranch(
                branchId,
                assignBranchServiceDto,
            ),
        ).rejects.toThrow(NotFoundException);

        expect(prismaMock.client.service.findUnique).not.toHaveBeenCalled();
        expect(prismaMock.client.branchService.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when the service does not exist', async () => {
        prismaMock.client.branch.findUnique.mockResolvedValue(branch);
        prismaMock.client.service.findUnique.mockResolvedValue(null);

        await expect(
            service.assignServiceToBranch(
                branchId,
                assignBranchServiceDto,
            ),
        ).rejects.toThrow(NotFoundException);

        expect(prismaMock.client.branchService.findUnique).not.toHaveBeenCalled();
        expect(prismaMock.client.branchService.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when the service is inactive', async () => {
        prismaMock.client.branch.findUnique.mockResolvedValue(branch);

        prismaMock.client.service.findUnique.mockResolvedValue({
            ...catalogService,
            isActive: false,
        });

        await expect(
            service.assignServiceToBranch(
                branchId,
                assignBranchServiceDto,
            ),
        ).rejects.toThrow(NotFoundException);

        expect(prismaMock.client.branchService.findUnique).not.toHaveBeenCalled();
        expect(prismaMock.client.branchService.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when the service is not published', async () => {
        prismaMock.client.branch.findUnique.mockResolvedValue(branch);

        prismaMock.client.service.findUnique.mockResolvedValue({
            ...catalogService,
            isPublished: false,
        });

        await expect(
            service.assignServiceToBranch(
                branchId,
                assignBranchServiceDto,
            ),
        ).rejects.toThrow(BadRequestException);

        expect(prismaMock.client.branchService.findUnique).not.toHaveBeenCalled();
        expect(prismaMock.client.branchService.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when the service is already assigned to the branch', async () => {
        prismaMock.client.branch.findUnique.mockResolvedValue(branch);
        prismaMock.client.service.findUnique.mockResolvedValue(catalogService);

        prismaMock.client.branchService.findUnique.mockResolvedValue({
            idBranchService: branchServiceId,
            isActive: true,
        });

        await expect(
            service.assignServiceToBranch(
                branchId,
                assignBranchServiceDto,
            ),
        ).rejects.toThrow(
            'Service is already assigned to this branch',
        );

        expect(prismaMock.client.branchService.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when an inactive assignment already exists', async () => {
        prismaMock.client.branch.findUnique.mockResolvedValue(branch);
        prismaMock.client.service.findUnique.mockResolvedValue(catalogService);

        prismaMock.client.branchService.findUnique.mockResolvedValue({
            idBranchService: branchServiceId,
            isActive: false,
        });

        await expect(
            service.assignServiceToBranch(
                branchId,
                assignBranchServiceDto,
            ),
        ).rejects.toThrow(
            'Service has an inactive assignment. Reactivate the existing assignment instead',
        );

        expect(prismaMock.client.branchService.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when Prisma returns a unique constraint error', async () => {
        prismaMock.client.branch.findUnique.mockResolvedValue(branch);
        prismaMock.client.service.findUnique.mockResolvedValue(catalogService);
        prismaMock.client.branchService.findUnique.mockResolvedValue(null);

        const prismaError = Object.assign(
            new Error('Unique constraint failed on branchId and serviceId'),
            {
                code: 'P2002',
            },
        );

        prismaMock.client.branchService.create.mockRejectedValue(prismaError);

        await expect(
            service.assignServiceToBranch(
                branchId,
                assignBranchServiceDto,
            ),
        ).rejects.toThrow(
            'Service is already assigned to this branch',
        );
    });

    it('should rethrow unexpected database errors', async () => {
        prismaMock.client.branch.findUnique.mockResolvedValue(branch);
        prismaMock.client.service.findUnique.mockResolvedValue(catalogService);
        prismaMock.client.branchService.findUnique.mockResolvedValue(null);

        const databaseError = new Error(
            'Database connection failed',
        );

        prismaMock.client.branchService.create.mockRejectedValue(databaseError);

        await expect(
            service.assignServiceToBranch(
                branchId,
                assignBranchServiceDto,
            ),
        ).rejects.toThrow(databaseError);

        expect(prismaMock.client.branchService.create).toHaveBeenCalledTimes(1);
    });
});