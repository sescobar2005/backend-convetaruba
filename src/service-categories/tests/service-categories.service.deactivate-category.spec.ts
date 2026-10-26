
import { beforeEach, describe, expect, it } from 'vitest';
import { createServiceCategoriesServiceTestContext } from './service-categories.service.test-utils.js';

describe('ServiceCategoriesService - deactivateCategory', () => {
    let service: ReturnType<typeof createServiceCategoriesServiceTestContext>['service'];
    let prismaMock: ReturnType<typeof createServiceCategoriesServiceTestContext>['prismaMock'];

    beforeEach(() => {
        ({ service, prismaMock } = createServiceCategoriesServiceTestContext());
    });

    it('should deactivate a category without active services', async () => {
        const idCategory = '550e8400-e29b-41d4-a716-446655440000';

        const existingCategory = {
            idCategory,
            isActive: true,
        };

        const deactivatedCategory = {
            idCategory,
            name: 'Consultas',
            slug: 'consultas',
            isActive: false,
        };

        prismaMock.client.serviceCategory.findUnique.mockResolvedValue(existingCategory);
        prismaMock.client.service.count.mockResolvedValue(0);
        prismaMock.client.serviceCategory.update.mockResolvedValue(deactivatedCategory);

        const result = await service.deactivateCategory(idCategory);

        expect(result).toEqual(deactivatedCategory);

        expect(prismaMock.client.serviceCategory.findUnique).toHaveBeenCalledWith({
            where: { idCategory },
            select: {
                idCategory: true,
                isActive: true,
            },
        });

        expect(prismaMock.client.service.count).toHaveBeenCalledWith({
            where: {
                categoryId: idCategory,
                isActive: true,
            },
        });

        expect(prismaMock.client.serviceCategory.update).toHaveBeenCalledWith({
            where: { idCategory },
            data: { isActive: false },
            select: {
                idCategory: true,
                name: true,
                slug: true,
                isActive: true,
            },
        });
    });

    it('should throw NotFoundException when category does not exist', async () => {
        const idCategory = '550e8400-e29b-41d4-a716-446655440000';

        prismaMock.client.serviceCategory.findUnique.mockResolvedValue(null);

        await expect(
            service.deactivateCategory(idCategory),
        ).rejects.toThrow('Active category not found');

        expect(prismaMock.client.service.count).not.toHaveBeenCalled();

        expect(prismaMock.client.serviceCategory.update).not.toHaveBeenCalled();
    });
 
    it('should throw NotFoundException when category is already inactive', async () => {
        const idCategory = '550e8400-e29b-41d4-a716-446655440000';

        prismaMock.client.serviceCategory.findUnique.mockResolvedValue({
            idCategory,
            isActive: false,
        });

        await expect(
            service.deactivateCategory(idCategory),
        ).rejects.toThrow('Active category not found');

        expect(prismaMock.client.service.count).not.toHaveBeenCalled();

        expect(prismaMock.client.serviceCategory.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when category has active services', async () => {
        const idCategory = '550e8400-e29b-41d4-a716-446655440000';

        prismaMock.client.serviceCategory.findUnique.mockResolvedValue({
            idCategory,
            isActive: true,
        });

        prismaMock.client.service.count.mockResolvedValue(2);

        await expect(
            service.deactivateCategory(idCategory),
        ).rejects.toThrow('Cannot deactivate a category with active services');

        expect(prismaMock.client.service.count).toHaveBeenCalledWith({
            where: {
                categoryId: idCategory,
                isActive: true,
            },
        });

        expect(prismaMock.client.serviceCategory.update).not.toHaveBeenCalled();
    });

});
