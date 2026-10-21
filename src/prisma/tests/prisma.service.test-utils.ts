import { vi } from 'vitest';

export const prismaClientMock = {
    $connect: vi.fn(),
    $disconnect: vi.fn()
};

export const PrismaClientMock = vi.fn(function () {
    return prismaClientMock;
});

export const PrismaPgMock = vi.fn();

export function resetPrismaMocks() {
    vi.clearAllMocks();

    prismaClientMock.$connect.mockResolvedValue(undefined);
    prismaClientMock.$disconnect.mockResolvedValue(undefined);
}