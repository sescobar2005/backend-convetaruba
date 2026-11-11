import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createServicesServiceTestContext } from './services.service.test-utils.js';

describe('ServicesService - updateServiceStatus', () => {
    let service: ReturnType<
        typeof createServicesServiceTestContext
    >['service'];

    let prismaMock: ReturnType<
        typeof createServicesServiceTestContext
    >['prismaMock'];

    const idService = '660e8400-e29b-41d4-a716-446655440000';

    beforeEach(() => {
        const context = createServicesServiceTestContext();

        service = context.service;
        prismaMock = context.prismaMock;
    });

    it('should publish an active service', async () => {
        prismaMock.client.service.findUnique.mockResolvedValue({
            idService,
            isActive: true,
            isPublished: false,
        });

        const publishedService = {
            idService,
            isActive: true,
            isPublished: true,
        };

        prismaMock.client.service.update.mockResolvedValue(publishedService);

        await expect(
            service.updateServiceStatus(idService, {
                isPublished: true,
            }),
        ).resolves.toEqual(publishedService);

        expect(prismaMock.client.service.update).toHaveBeenCalledWith({
            where: { idService },
            data: { isPublished: true },
            include: { category: true },
        });
    });

    it('should unpublish an active service', async () => {
        prismaMock.client.service.findUnique.mockResolvedValue({
            idService,
            isActive: true,
            isPublished: true,
        });

        prismaMock.client.service.update.mockResolvedValue({
            idService,
            isActive: true,
            isPublished: false,
        });

        await expect(
            service.updateServiceStatus(idService, {
                isPublished: false,
            }),
        ).resolves.toMatchObject({
            isActive: true,
            isPublished: false,
        });

        expect(prismaMock.client.service.update).toHaveBeenCalledWith({
            where: { idService },
            data: { isPublished: false },
            include: { category: true },
        });
    });

    it('should reactivate a service without publishing it', async () => {
        prismaMock.client.service.findUnique.mockResolvedValue({
            idService,
            isActive: false,
            isPublished: false,
        });

        prismaMock.client.service.update.mockResolvedValue({
            idService,
            isActive: true,
            isPublished: false,
        });

        await expect(
            service.updateServiceStatus(idService, {
                isActive: true,
            }),
        ).resolves.toMatchObject({
            isActive: true,
            isPublished: false,
        });

        expect(prismaMock.client.service.update).toHaveBeenCalledWith({
            where: { idService },
            data: { isActive: true },
            include: { category: true },
        });
    });

    it('should deactivate and automatically unpublish a service', async () => {
        prismaMock.client.service.findUnique.mockResolvedValue({
            idService,
            isActive: true,
            isPublished: true,
        });

        prismaMock.client.service.update.mockResolvedValue({
            idService,
            isActive: false,
            isPublished: false,
        });

        await expect(
            service.updateServiceStatus(idService, {
                isActive: false,
            }),
        ).resolves.toMatchObject({
            isActive: false,
            isPublished: false,
        });

        expect(prismaMock.client.service.update).toHaveBeenCalledWith({
            where: { idService },
            data: {
                isActive: false,
                isPublished: false,
            },
            include: { category: true },
        });
    });

    it('should reject publishing an inactive service', async () => {
        prismaMock.client.service.findUnique.mockResolvedValue({
            idService,
            isActive: false,
            isPublished: false,
        });

        await expect(
            service.updateServiceStatus(idService, {
                isPublished: true,
            }),
        ).rejects.toThrow('An inactive service cannot be published');

        expect(prismaMock.client.service.update).not.toHaveBeenCalled();
    });

    it('should reject an empty update body', async () => {
        await expect(
            service.updateServiceStatus(idService, {}),
        ).rejects.toThrow('At least one status field must be provided');

        expect(prismaMock.client.service.findUnique).not.toHaveBeenCalled();
        expect(prismaMock.client.service.update).not.toHaveBeenCalled();
    });

    it('should throw an error when the service does not exist', async () => {
        prismaMock.client.service.findUnique.mockResolvedValue(null);

        await expect(
            service.updateServiceStatus(idService, {
                isActive: true,
            }),
        ).rejects.toThrow('Service not found');

        expect(prismaMock.client.service.update).not.toHaveBeenCalled();
    });
});