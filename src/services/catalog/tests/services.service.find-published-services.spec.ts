import { beforeEach, describe, expect, it } from 'vitest';
import { createServicesServiceTestContext } from './services.service.test-utils.js';

describe('ServicesService - findPublishedServices', () => {
    let service: ReturnType<typeof createServicesServiceTestContext>['service'];
    let prismaMock: ReturnType<typeof createServicesServiceTestContext>['prismaMock'];

    beforeEach(() => {
        ({ service, prismaMock } = createServicesServiceTestContext());
    });

    it('should return published services from active categories', async () => {
        const services = [
            {
                idService: 'service-1',
                name: 'Consulta general',
                slug: 'consulta-general',
                isActive: true,
                isPublished: true,
                category: {
                    idCategory: 'category-1',
                    name: 'Consultas',
                    isActive: true,
                },
            },
        ];

        prismaMock.client.service.findMany.mockResolvedValue(services);

        const result = await service.findPublishedServices();

        expect(result).toEqual(services);

        expect(prismaMock.client.service.findMany).toHaveBeenCalledWith({
            where: {
                isActive: true,
                isPublished: true,
                category: {
                    is: {
                        isActive: true,
                    },
                },
            },
            include: {
                category: true,
            },
            orderBy: {
                name: 'asc',
            },
        });
    });
});