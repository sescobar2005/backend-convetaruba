import { beforeEach, describe, expect, it } from 'vitest';
import { createServicesServiceTestContext } from './services.service.test-utils.js';

describe('ServicesService - deactivateService', () => {
    let service: ReturnType<typeof createServicesServiceTestContext>['service'];
    let prismaMock: ReturnType<typeof createServicesServiceTestContext>['prismaMock'];

    beforeEach(() => {
        ({ service, prismaMock } = createServicesServiceTestContext());
    });

    it('should deactivate an active service', async () => {
        const idService = '660e8400-e29b-41d4-a716-446655440000';

        const existingService = {
            idService,
            isActive: true,
        };

        const deactivatedService = {
            idService,
            name: 'Consulta general',
            slug: 'consulta-general',
            isActive: false,
        };

        prismaMock.client.service.findUnique.mockResolvedValue(existingService);
        prismaMock.client.service.update.mockResolvedValue(deactivatedService);

        const result = await service.deactivateService(idService);

        expect(result).toEqual(deactivatedService);

        expect(prismaMock.client.service.findUnique).toHaveBeenCalledWith({
            where: { idService },
            select: { idService: true, isActive: true },
        });

        expect(prismaMock.client.service.update).toHaveBeenCalledWith({
            where: { idService },
            data: { isActive: false },
            select: {
                idService: true,
                name: true,
                slug: true,
                isActive: true,
            },
        });
    });

    it('should throw NotFoundException when service does not exist', async () => {
        const idService = '660e8400-e29b-41d4-a716-446655440000';

        prismaMock.client.service.findUnique.mockResolvedValue(null);

        await expect(
            service.deactivateService(idService),
        ).rejects.toThrow('Active service not found');

        expect(prismaMock.client.service.findUnique).toHaveBeenCalledWith({
            where: { idService },
            select: { idService: true, isActive: true },
        });

        expect(prismaMock.client.service.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when service is already inactive', async () => {
        const idService = '660e8400-e29b-41d4-a716-446655440000';

        prismaMock.client.service.findUnique.mockResolvedValue({
            idService,
            isActive: false,
        });

        await expect(
            service.deactivateService(idService),
        ).rejects.toThrow('Active service not found');

        expect(prismaMock.client.service.findUnique).toHaveBeenCalledWith({
            where: { idService },
            select: { idService: true, isActive: true },
        });

        expect(prismaMock.client.service.update).not.toHaveBeenCalled();
    });

});