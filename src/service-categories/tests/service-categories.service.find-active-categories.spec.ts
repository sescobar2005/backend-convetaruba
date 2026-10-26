
import { beforeEach, describe, expect, it } from 'vitest';
import { createServiceCategoriesServiceTestContext } from './service-categories.service.test-utils.js';

describe('ServiceCategoriesService - findActiveCategories', () => {
    let service: ReturnType<typeof createServiceCategoriesServiceTestContext>['service'];
    let prismaMock: ReturnType<typeof createServiceCategoriesServiceTestContext>['prismaMock'];

    beforeEach(() => {
        ({ service, prismaMock } = createServiceCategoriesServiceTestContext());
    });

    it('should return active categories ordered by name', async () => {
        const categories = [
            {
                idCategory: 'category-1',
                name: 'Consultas',
                slug: 'consultas',
                isActive: true,
            },
            {
                idCategory: 'category-2',
                name: 'Tratamientos',
                slug: 'tratamientos',
                isActive: true,
            },
        ];

        prismaMock.client.serviceCategory.findMany.mockResolvedValue(categories);

        const result = await service.findActiveCategories();

        expect(result).toEqual(categories);

        expect(prismaMock.client.serviceCategory.findMany).toHaveBeenCalledWith({
            where: { isActive: true },
            orderBy: { name: 'asc' },
        });

        expect(prismaMock.client.serviceCategory.findMany).toHaveBeenCalledOnce();
    });
    
});
