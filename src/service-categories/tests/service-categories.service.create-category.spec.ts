
import { beforeEach, describe, expect, it } from 'vitest';
import { createServiceCategoriesServiceTestContext } from './service-categories.service.test-utils.js';

describe('ServiceCategoriesService - createCategory', () => {
    let service: ReturnType<typeof createServiceCategoriesServiceTestContext>['service'];
    let prismaMock: ReturnType<typeof createServiceCategoriesServiceTestContext>['prismaMock'];

    beforeEach(() => {
        ({ service, prismaMock } = createServiceCategoriesServiceTestContext());
    });

    it('should create a category successfully', async () => {
        const createServiceCategoryDto = {
            name: 'Consultas',
            slug: 'consultas',
            description: 'Categoría de consultas médicas',
        };

        const createdCategory = {
            idCategory: '550e8400-e29b-41d4-a716-446655440000',
            ...createServiceCategoryDto,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        prismaMock.client.serviceCategory.create.mockResolvedValue(createdCategory);

        const result = await service.createCategory(createServiceCategoryDto);

        expect(result).toEqual(createdCategory);

        expect(prismaMock.client.serviceCategory.create).toHaveBeenCalledWith({
            data: createServiceCategoryDto,
        });

        expect(prismaMock.client.serviceCategory.create).toHaveBeenCalledOnce();
    });

    it('should throw BadRequestException when slug already exists', async () => {
        const createServiceCategoryDto = {
            name: 'Consultas',
            slug: 'consultas',
            description: 'Categoría de consultas médicas',
        };

        prismaMock.client.serviceCategory.create.mockRejectedValue(
            Object.assign(new Error('Unique constraint failed'), {
                code: 'P2002',
            }),
        );

        await expect(
            service.createCategory(createServiceCategoryDto),
        ).rejects.toThrow('A category with this slug already exists');

        expect(prismaMock.client.serviceCategory.create).toHaveBeenCalledWith({
            data: createServiceCategoryDto,
        });
    });

});
