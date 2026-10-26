
import { beforeEach, describe, expect, it } from 'vitest';
import { createServiceCategoriesServiceTestContext } from './service-categories.service.test-utils.js';

describe('ServiceCategoriesService - updateCategory', () => {
    let service: ReturnType<typeof createServiceCategoriesServiceTestContext>['service'];
    let prismaMock: ReturnType<typeof createServiceCategoriesServiceTestContext>['prismaMock'];

    beforeEach(() => {
        ({ service, prismaMock } = createServiceCategoriesServiceTestContext());
    });

    it('should update an existing category', async () => {
        const idCategory = '550e8400-e29b-41d4-a716-446655440000';

        const updateServiceCategoryDto = {
            name: 'Consultas especializadas',
            description: 'Categoría actualizada',
        };

        const updatedCategory = {
            idCategory,
            name: 'Consultas especializadas',
            slug: 'consultas',
            description: 'Categoría actualizada',
            isActive: true,
        };

        prismaMock.client.serviceCategory.findUnique.mockResolvedValue({
            idCategory,
        });

        prismaMock.client.serviceCategory.update.mockResolvedValue(updatedCategory);

        const result = await service.updateCategory(
            idCategory,
            updateServiceCategoryDto,
        );

        expect(result).toEqual(updatedCategory);

        expect(prismaMock.client.serviceCategory.findUnique).toHaveBeenCalledWith({
            where: { idCategory },
            select: { idCategory: true },
        });

        expect(prismaMock.client.serviceCategory.update).toHaveBeenCalledWith({
            where: { idCategory },
            data: updateServiceCategoryDto,
        });

        expect(prismaMock.client.serviceCategory.update).toHaveBeenCalledOnce();
    });

    it('should throw NotFoundException when category does not exist', async () => {
        const idCategory = '550e8400-e29b-41d4-a716-446655440000';

        prismaMock.client.serviceCategory.findUnique.mockResolvedValue(null);

        await expect(
            service.updateCategory(idCategory, {
                name: 'Consultas especializadas',
            }),
        ).rejects.toThrow('Category not found');

        expect(prismaMock.client.serviceCategory.findUnique).toHaveBeenCalledWith({
            where: { idCategory },
            select: { idCategory: true },
        });

        expect(prismaMock.client.serviceCategory.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when update data is empty', async () => {
        const idCategory = '550e8400-e29b-41d4-a716-446655440000';

        await expect(
            service.updateCategory(idCategory, {}),
        ).rejects.toThrow('At least one field must be provided');

        expect(prismaMock.client.serviceCategory.findUnique).not.toHaveBeenCalled();

        expect(prismaMock.client.serviceCategory.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when slug already exists', async () => {
        const idCategory = '550e8400-e29b-41d4-a716-446655440000';

        prismaMock.client.serviceCategory.findUnique.mockResolvedValue({
            idCategory,
        });

        prismaMock.client.serviceCategory.update.mockRejectedValue(
            Object.assign(new Error('Unique constraint failed'), {
                code: 'P2002',
            }),
        );

        await expect(
            service.updateCategory(idCategory, {
                slug: 'consultas-especializadas',
            }),
        ).rejects.toThrow('A category with this slug already exists');

        expect(prismaMock.client.serviceCategory.update).toHaveBeenCalledWith({
            where: { idCategory },
            data: { slug: 'consultas-especializadas' },
        });
    });

});
