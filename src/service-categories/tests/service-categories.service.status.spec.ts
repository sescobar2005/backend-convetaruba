import { beforeEach, describe, expect, it } from 'vitest';
import { createServiceCategoriesServiceTestContext } from './service-categories.service.test-utils.js';

describe('ServiceCategoriesService - updateCategoryStatus', () => {
    let service: ReturnType<typeof createServiceCategoriesServiceTestContext>['service'];
    let prismaMock: ReturnType<typeof createServiceCategoriesServiceTestContext>['prismaMock'];

    beforeEach(() => {
        ({ service, prismaMock } = createServiceCategoriesServiceTestContext());
    });

    it('should deactivate a category without active services', async () => {
        const idCategory = '550e8400-e29b-41d4-a716-446655440000';
        const updateServiceCategoryStatusDto = { isActive: false };

        const deactivatedCategory = {
            idCategory,
            name: 'Consultas',
            slug: 'consultas',
            isActive: false,
        };

        prismaMock.client.serviceCategory.findUnique.mockResolvedValue({
            idCategory,
            isActive: true,
        });
        prismaMock.client.service.count.mockResolvedValue(0);
        prismaMock.client.serviceCategory.update.mockResolvedValue(deactivatedCategory);

        const result = await service.updateCategoryStatus(
            idCategory,
            updateServiceCategoryStatusDto,
        );

        expect(result).toEqual(deactivatedCategory);

        expect(prismaMock.client.service.count).toHaveBeenCalledWith({
            where: { categoryId: idCategory, isActive: true },
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

    it('should reactivate an inactive category without checking active services', async () => {
        const idCategory = '550e8400-e29b-41d4-a716-446655440000';
        const updateServiceCategoryStatusDto = { isActive: true };

        const reactivatedCategory = {
            idCategory,
            name: 'Consultas',
            slug: 'consultas',
            isActive: true,
        };

        prismaMock.client.serviceCategory.findUnique.mockResolvedValue({
            idCategory,
            isActive: false,
        });
        prismaMock.client.serviceCategory.update.mockResolvedValue(reactivatedCategory);

        const result = await service.updateCategoryStatus(
            idCategory,
            updateServiceCategoryStatusDto,
        );

        expect(result).toEqual(reactivatedCategory);

        expect(prismaMock.client.service.count).not.toHaveBeenCalled();

        expect(prismaMock.client.serviceCategory.update).toHaveBeenCalledWith({
            where: { idCategory },
            data: { isActive: true },
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
            service.updateCategoryStatus(idCategory, { isActive: false }),
        ).rejects.toThrow('Category not found');

        expect(prismaMock.client.service.count).not.toHaveBeenCalled();
        expect(prismaMock.client.serviceCategory.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when category is already inactive', async () => {
        const idCategory = '550e8400-e29b-41d4-a716-446655440000';

        prismaMock.client.serviceCategory.findUnique.mockResolvedValue({
            idCategory,
            isActive: false,
        });

        await expect(
            service.updateCategoryStatus(idCategory, { isActive: false }),
        ).rejects.toThrow('Category is already inactive');

        expect(prismaMock.client.service.count).not.toHaveBeenCalled();
        expect(prismaMock.client.serviceCategory.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when category is already active', async () => {
        const idCategory = '550e8400-e29b-41d4-a716-446655440000';

        prismaMock.client.serviceCategory.findUnique.mockResolvedValue({
            idCategory,
            isActive: true,
        });

        await expect(
            service.updateCategoryStatus(idCategory, { isActive: true }),
        ).rejects.toThrow('Category is already active');

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
            service.updateCategoryStatus(idCategory, { isActive: false }),
        ).rejects.toThrow('Cannot deactivate a category with active services');

        expect(prismaMock.client.service.count).toHaveBeenCalledWith({
            where: { categoryId: idCategory, isActive: true },
        });

        expect(prismaMock.client.serviceCategory.update).not.toHaveBeenCalled();
    });
});