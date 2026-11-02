import { beforeEach, describe, expect, it } from 'vitest';
import { createServicesServiceTestContext } from './services.service.test-utils.js';

describe('ServicesService - createService', () => {
    let service: ReturnType<typeof createServicesServiceTestContext>['service'];
    let prismaMock: ReturnType<typeof createServicesServiceTestContext>['prismaMock'];

    beforeEach(() => {
        ({ service, prismaMock } = createServicesServiceTestContext());
    });

    it('should create a service associated with an active category', async () => {
        const createServiceDto = {
            name: 'Consulta general',
            slug: 'consulta-general',
            description: 'Servicio de consulta general',
            categoryId: '550e8400-e29b-41d4-a716-446655440000',
        };

        const category = {
            idCategory: createServiceDto.categoryId,
            isActive: true,
        };

        const createdService = {
            idService: '660e8400-e29b-41d4-a716-446655440000',
            ...createServiceDto,
            shortDescription: null,
            isPublished: false,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            category: {
                idCategory: createServiceDto.categoryId,
                name: 'Consultas',
                isActive: true,
            },
        };

        prismaMock.client.serviceCategory.findUnique.mockResolvedValue(category);
        prismaMock.client.service.create.mockResolvedValue(createdService);

        const result = await service.createService(createServiceDto);

        expect(result).toEqual(createdService);

        expect(prismaMock.client.serviceCategory.findUnique).toHaveBeenCalledWith({
            where: {
                idCategory: createServiceDto.categoryId,
            },
            select: {
                idCategory: true,
                isActive: true,
            },
        });

        expect(prismaMock.client.service.create).toHaveBeenCalledWith({
            data: {
                name: createServiceDto.name,
                slug: createServiceDto.slug,
                description: createServiceDto.description,
                categoryId: createServiceDto.categoryId,
            },
            include: {
                category: true,
            },
        });
    });
 
    it('should throw NotFoundException when the category does not exist', async () => {
        const createServiceDto = {
            name: 'Consulta general',
            slug: 'consulta-general',
            categoryId: '550e8400-e29b-41d4-a716-446655440000',
        };

        prismaMock.client.serviceCategory.findUnique.mockResolvedValue(null);

        await expect(service.createService(createServiceDto))
            .rejects.toThrow('Category not found or inactive');

        expect(prismaMock.client.service.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when the category is inactive', async () => {
        const createServiceDto = {
            name: 'Consulta general',
            slug: 'consulta-general',
            categoryId: '550e8400-e29b-41d4-a716-446655440000',
        };

        prismaMock.client.serviceCategory.findUnique.mockResolvedValue({
            idCategory: createServiceDto.categoryId,
            isActive: false,
        });

        await expect(service.createService(createServiceDto))
            .rejects.toThrow('Category not found or inactive');

        expect(prismaMock.client.service.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when the slug already exists', async () => {
        const createServiceDto = {
            name: 'Consulta general',
            slug: 'consulta-general',
            categoryId: '550e8400-e29b-41d4-a716-446655440000',
        };

        prismaMock.client.serviceCategory.findUnique.mockResolvedValue({
            idCategory: createServiceDto.categoryId,
            isActive: true,
        });

        prismaMock.client.service.create.mockRejectedValue(
            Object.assign(new Error('Unique constraint failed'), {
                code: 'P2002',
            }),
        );

        await expect(service.createService(createServiceDto))
            .rejects.toThrow('A service with this slug already exists');
    });
    
});