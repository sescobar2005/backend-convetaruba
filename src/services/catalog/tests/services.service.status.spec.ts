import { beforeEach, describe, expect, it } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { createServicesServiceTestContext } from './services.service.test-utils.js';

describe('ServicesService - updateServiceStatus (deactivation and activation)', () => {
    let service: ReturnType<typeof createServicesServiceTestContext>['service'];
    let prismaMock: ReturnType<typeof createServicesServiceTestContext>['prismaMock'];

    beforeEach(() => {
        ({ service, prismaMock } = createServicesServiceTestContext());
    });

    it('should deactivate an active service and unpublish it', async () => {
        const idService = '660e8400-e29b-41d4-a716-446655440000';

        const existingService = {
            idService,
            isActive: true,
            isPublished: true,
        };

        const deactivatedService = {
            idService,
            isActive: false,
            isPublished: false,
        };

        prismaMock.client.service.findUnique.mockResolvedValue(existingService);
        prismaMock.client.service.update.mockResolvedValue(deactivatedService);

        const result = await service.updateServiceStatus(idService, {
            isActive: false,
        });

        expect(result).toEqual(deactivatedService);

        expect(prismaMock.client.service.findUnique).toHaveBeenCalledWith({
            where: { idService },
            select: {
                idService: true,
                isActive: true,
                isPublished: true,
            },
        });

        expect(prismaMock.client.service.update).toHaveBeenCalledWith({
            where: { idService },
            data: {
                isActive: false,
                isPublished: false,
            },
            include: {
                category: true,
            },
        });
    });

    it('should reactivate an inactive service without publishing it', async () => {
        const idService = '660e8400-e29b-41d4-a716-446655440000';

        const existingService = {
            idService,
            isActive: false,
            isPublished: false,
        };

        const reactivatedService = {
            idService,
            isActive: true,
            isPublished: false,
        };

        prismaMock.client.service.findUnique.mockResolvedValue(existingService);
        prismaMock.client.service.update.mockResolvedValue(reactivatedService);

        const result = await service.updateServiceStatus(idService, {
            isActive: true,
        });

        expect(result).toEqual(reactivatedService);

        expect(prismaMock.client.service.update).toHaveBeenCalledWith({
            where: { idService },
            data: {
                isActive: true,
            },
            include: {
                category: true,
            },
        });
    });

    it('should throw NotFoundException when service does not exist', async () => {
        const idService = '660e8400-e29b-41d4-a716-446655440000';

        prismaMock.client.service.findUnique.mockResolvedValue(null);

        await expect(
            service.updateServiceStatus(idService, {
                isActive: false,
            }),
        ).rejects.toThrow(NotFoundException);

        expect(prismaMock.client.service.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when no status field is provided', async () => {
        const idService = '660e8400-e29b-41d4-a716-446655440000';

        await expect(
            service.updateServiceStatus(idService, {}),
        ).rejects.toThrow(BadRequestException);

        expect(prismaMock.client.service.findUnique).not.toHaveBeenCalled();
        expect(prismaMock.client.service.update).not.toHaveBeenCalled();
    });
});