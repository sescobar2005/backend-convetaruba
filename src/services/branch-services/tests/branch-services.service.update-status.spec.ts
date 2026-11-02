import {
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import {
    beforeEach,
    describe,
    expect,
    it,
} from 'vitest';

import { createBranchServicesServiceTestContext } from './branch-services-test.utils.js';

describe('BranchServicesService - updateBranchServiceStatus', () => {
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
    };

    const activeCatalogService = {
        isActive: true,
        isPublished: true,
    };

    const inactiveBranchService = {
        idBranchService: branchServiceId,
        branchId,
        isActive: false,
        service: activeCatalogService,
    };

    const activeBranchService = {
        idBranchService: branchServiceId,
        branchId,
        isActive: true,
        service: activeCatalogService,
    };

    const updatedAssignment = {
        idBranchService: branchServiceId,
        branchId,
        serviceId,
        isActive: true,
        createdAt,
        updatedAt,
        branch: {
            idBranch: branchId,
            name: 'Convetaruba Savaneta',
            address: 'Savaneta, Aruba',
            city: 'Savaneta',
            department: 'Aruba',
            isActive: true,
        },
        service: {
            idService: serviceId,
            name: 'Consulta veterinaria general',
            isActive: true,
            isPublished: true,
        },
    };

    beforeEach(() => {
        ({ service, prismaMock } = createBranchServicesServiceTestContext());
    });

    it('should activate an inactive branch service assignment', async () => {
        prismaMock.client.branch.findUnique.mockResolvedValue(branch);
        prismaMock.client.branchService.findUnique.mockResolvedValue(
            inactiveBranchService,
        );
        prismaMock.client.branchService.update.mockResolvedValue(
            updatedAssignment,
        );

        const result = await service.updateBranchServiceStatus(
            branchId,
            branchServiceId,
            true,
        );

        expect(result).toEqual(updatedAssignment);

        expect(prismaMock.client.branch.findUnique).toHaveBeenCalledWith({
            where: {
                idBranch: branchId,
            },
            select: {
                idBranch: true,
            },
        });

        expect(prismaMock.client.branchService.findUnique).toHaveBeenCalledWith({
            where: {
                idBranchService: branchServiceId,
            },
            select: {
                idBranchService: true,
                branchId: true,
                isActive: true,
                service: {
                    select: {
                        isActive: true,
                        isPublished: true,
                    },
                },
            },
        });

        expect(prismaMock.client.branchService.update).toHaveBeenCalledWith({
            where: {
                idBranchService: branchServiceId,
            },
            data: {
                isActive: true,
            },
            include: {
                service: true,
                branch: true,
            },
        });
    });

    it('should deactivate an active branch service assignment', async () => {
        const deactivatedAssignment = {
            ...updatedAssignment,
            isActive: false,
        };

        prismaMock.client.branch.findUnique.mockResolvedValue(branch);
        prismaMock.client.branchService.findUnique.mockResolvedValue(
            activeBranchService,
        );
        prismaMock.client.branchService.update.mockResolvedValue(
            deactivatedAssignment,
        );

        const result = await service.updateBranchServiceStatus(
            branchId,
            branchServiceId,
            false,
        );

        expect(result).toEqual(deactivatedAssignment);

        expect(prismaMock.client.branchService.update).toHaveBeenCalledWith({
            where: {
                idBranchService: branchServiceId,
            },
            data: {
                isActive: false,
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
            service.updateBranchServiceStatus(
                branchId,
                branchServiceId,
                true,
            ),
        ).rejects.toThrow(NotFoundException);

        expect(prismaMock.client.branchService.findUnique).not.toHaveBeenCalled();
        expect(prismaMock.client.branchService.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when the branch service assignment does not exist', async () => {
        prismaMock.client.branch.findUnique.mockResolvedValue(branch);
        prismaMock.client.branchService.findUnique.mockResolvedValue(null);

        await expect(
            service.updateBranchServiceStatus(
                branchId,
                branchServiceId,
                true,
            ),
        ).rejects.toThrow(NotFoundException);

        expect(prismaMock.client.branchService.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when the assignment belongs to another branch', async () => {
        const anotherBranchId = 'd4e5f6a7-b8c9-4012-b456-789abcdef012';

        prismaMock.client.branch.findUnique.mockResolvedValue(branch);
        prismaMock.client.branchService.findUnique.mockResolvedValue({
            ...inactiveBranchService,
            branchId: anotherBranchId,
        });

        await expect(
            service.updateBranchServiceStatus(
                branchId,
                branchServiceId,
                true,
            ),
        ).rejects.toThrow(NotFoundException);

        expect(prismaMock.client.branchService.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when the assignment is already active', async () => {
        prismaMock.client.branch.findUnique.mockResolvedValue(branch);
        prismaMock.client.branchService.findUnique.mockResolvedValue(
            activeBranchService,
        );

        await expect(
            service.updateBranchServiceStatus(
                branchId,
                branchServiceId,
                true,
            ),
        ).rejects.toThrow('Service is already active in this branch');

        expect(prismaMock.client.branchService.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when the assignment is already inactive', async () => {
        prismaMock.client.branch.findUnique.mockResolvedValue(branch);
        prismaMock.client.branchService.findUnique.mockResolvedValue(
            inactiveBranchService,
        );

        await expect(
            service.updateBranchServiceStatus(
                branchId,
                branchServiceId,
                false,
            ),
        ).rejects.toThrow('Service is already inactive in this branch');

        expect(prismaMock.client.branchService.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when the catalog service is inactive', async () => {
        prismaMock.client.branch.findUnique.mockResolvedValue(branch);
        prismaMock.client.branchService.findUnique.mockResolvedValue({
            ...inactiveBranchService,
            service: {
                ...activeCatalogService,
                isActive: false,
            },
        });

        await expect(
            service.updateBranchServiceStatus(
                branchId,
                branchServiceId,
                true,
            ),
        ).rejects.toThrow(
            'Only active and published services can be activated in a branch',
        );

        expect(prismaMock.client.branchService.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when the catalog service is not published', async () => {
        prismaMock.client.branch.findUnique.mockResolvedValue(branch);
        prismaMock.client.branchService.findUnique.mockResolvedValue({
            ...inactiveBranchService,
            service: {
                ...activeCatalogService,
                isPublished: false,
            },
        });

        await expect(
            service.updateBranchServiceStatus(
                branchId,
                branchServiceId,
                true,
            ),
        ).rejects.toThrow(
            'Only active and published services can be activated in a branch',
        );

        expect(prismaMock.client.branchService.update).not.toHaveBeenCalled();
    });

    it('should rethrow unexpected database errors when searching for the branch', async () => {
        const databaseError = new Error('Database connection failed');

        prismaMock.client.branch.findUnique.mockRejectedValue(databaseError);

        await expect(
            service.updateBranchServiceStatus(
                branchId,
                branchServiceId,
                true,
            ),
        ).rejects.toThrow(databaseError);

        expect(prismaMock.client.branchService.findUnique).not.toHaveBeenCalled();
    });

    it('should rethrow unexpected database errors when searching for the assignment', async () => {
        const databaseError = new Error('Database query failed');

        prismaMock.client.branch.findUnique.mockResolvedValue(branch);
        prismaMock.client.branchService.findUnique.mockRejectedValue(
            databaseError,
        );

        await expect(
            service.updateBranchServiceStatus(
                branchId,
                branchServiceId,
                true,
            ),
        ).rejects.toThrow(databaseError);

        expect(prismaMock.client.branchService.update).not.toHaveBeenCalled();
    });

    it('should rethrow unexpected database errors when updating the assignment', async () => {
        const databaseError = new Error('Database update failed');

        prismaMock.client.branch.findUnique.mockResolvedValue(branch);
        prismaMock.client.branchService.findUnique.mockResolvedValue(
            inactiveBranchService,
        );
        prismaMock.client.branchService.update.mockRejectedValue(databaseError);

        await expect(
            service.updateBranchServiceStatus(
                branchId,
                branchServiceId,
                true,
            ),
        ).rejects.toThrow(databaseError);

        expect(prismaMock.client.branchService.update).toHaveBeenCalledTimes(1);
    });
});