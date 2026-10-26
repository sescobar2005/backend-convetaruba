
import { beforeEach, describe, expect, it } from 'vitest';
import { createServicesServiceTestContext } from './services.service.test-utils.js';

describe('ServicesService - updateService', () => {
    let service: ReturnType<typeof createServicesServiceTestContext>['service'];
    let prismaMock: ReturnType<typeof createServicesServiceTestContext>['prismaMock'];

    beforeEach(() => {
        ({ service, prismaMock } = createServicesServiceTestContext());
    });

    it('should update an existing service', async () => {
        const idService = '660e8400-e29b-41d4-a716-446655440000';

        const updateServiceDto = {
            name: 'Consulta especializada',
            description: 'Servicio actualizado',
        };

        const existingService = {
            idService,
        };

        const updatedService = {
            idService,
            name: 'Consulta especializada',
            slug: 'consulta-general',
            description: 'Servicio actualizado',
            shortDescription: null,
            categoryId: '550e8400-e29b-41d4-a716-446655440000',
            isPublished: false,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            category: {
                idCategory: '550e8400-e29b-41d4-a716-446655440000',
                name: 'Consultas',
                isActive: true,
            },
        };

        prismaMock.client.service.findUnique.mockResolvedValue(existingService);
        prismaMock.client.service.update.mockResolvedValue(updatedService);

        const result = await service.updateService(idService, updateServiceDto);

        expect(result).toEqual(updatedService);

        expect(prismaMock.client.service.findUnique).toHaveBeenCalledWith({
            where: {
                idService,
            },
            select: {
                idService: true,
            },
        });

        expect(prismaMock.client.service.update).toHaveBeenCalledWith({
            where: {
                idService,
            },
            data: updateServiceDto,
            include: {
                category: true,
            },
        });
    });

    it('should throw BadRequestException when update data is empty', async () => {
        const idService = '660e8400-e29b-41d4-a716-446655440000';

        await expect(
            service.updateService(idService, {}),
        ).rejects.toThrow('At least one field must be provided');

        expect(prismaMock.client.service.findUnique).not.toHaveBeenCalled();
    });
 
    it('should throw NotFoundException when service does not exist', async () => {
        const idService = '660e8400-e29b-41d4-a716-446655440000';

        prismaMock.client.service.findUnique.mockResolvedValue(null);

        await expect(
            service.updateService(idService, {
                name: 'Consulta especializada',
            }),
        ).rejects.toThrow('Service not found');

        expect(prismaMock.client.service.findUnique).toHaveBeenCalledWith({
            where: { idService },
            select: { idService: true },
        });

        expect(prismaMock.client.service.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when category does not exist', async () => {
        const idService = '660e8400-e29b-41d4-a716-446655440000';
        const categoryId = '550e8400-e29b-41d4-a716-446655440000';

        prismaMock.client.service.findUnique.mockResolvedValue({
            idService,
        });

        prismaMock.client.serviceCategory.findUnique.mockResolvedValue(null);

        await expect(
            service.updateService(idService, {
                categoryId,
            }),
        ).rejects.toThrow('Category not found or inactive');

        expect(prismaMock.client.serviceCategory.findUnique).toHaveBeenCalledWith({
            where: { idCategory: categoryId },
            select: { idCategory: true, isActive: true },
        });

        expect(prismaMock.client.service.update).not.toHaveBeenCalled();
    });
 
    it('should throw NotFoundException when category is inactive', async () => {
        const idService = '660e8400-e29b-41d4-a716-446655440000';
        const categoryId = '550e8400-e29b-41d4-a716-446655440000';

        prismaMock.client.service.findUnique.mockResolvedValue({
            idService,
        });

        prismaMock.client.serviceCategory.findUnique.mockResolvedValue({
            idCategory: categoryId,
            isActive: false,
        });

        await expect(
            service.updateService(idService, {
                categoryId,
            }),
        ).rejects.toThrow('Category not found or inactive');

        expect(prismaMock.client.service.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when slug already exists', async () => {
        const idService = '660e8400-e29b-41d4-a716-446655440000';

        prismaMock.client.service.findUnique.mockResolvedValue({
            idService,
        });

        prismaMock.client.service.update.mockRejectedValue(
            Object.assign(new Error('Unique constraint failed'), {
                code: 'P2002',
            }),
        );

        await expect(
            service.updateService(idService, {
                slug: 'consulta-general',
            }),
        ).rejects.toThrow('A service with this slug already exists');
    });

});