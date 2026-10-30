import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { CreateStaffDto } from './dto/create-staff.dto.js';
import { UpdateStaffDto } from './dto/update-staff.dto.js';
import { UpdateStaffStatusDto } from './dto/update-staff-status.dto.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class StaffService {
    constructor(
        private readonly prismaService: PrismaService,
    ) {}

    private isUniqueConstraintError(error: unknown): boolean {
        return (
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            error.code === 'P2002'
        );
    }

    async createStaff(createStaffDto: CreateStaffDto) {
        const user = await this.prismaService.client.user.findUnique({
            where: {
                idUser: createStaffDto.userId,
            },
            select: {
                idUser: true,
                role: true,
                staff: {
                    select: {
                        idStaff: true,
                    },
                },
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (user.role === 'CUSTOMER') {
            throw new BadRequestException(
                'Customers cannot have a staff record',
            );
        }

        if (user.staff) {
            throw new ConflictException(
                'This user already has a staff record',
            );
        }

        try {
            return await this.prismaService.client.staff.create({
                data: {
                    userId: createStaffDto.userId,
                    staffNumber: createStaffDto.staffNumber,
                    position: createStaffDto.position,
                    specialty: createStaffDto.specialty,
                },
                select: {
                    idStaff: true,
                    userId: true,
                    staffNumber: true,
                    position: true,
                    specialty: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
        } catch (error) {
            if (this.isUniqueConstraintError(error)) {
                throw new ConflictException(
                    'Staff number or user is already registered',
                );
            }

            throw error;
        }
    }

    async findAllStaff() {
        return this.prismaService.client.staff.findMany({
            orderBy: {
                createdAt: 'desc',
            },
            select: {
                idStaff: true,
                userId: true,
                staffNumber: true,
                position: true,
                specialty: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                        mobileNumber: true,
                        role: true,
                    },
                },
            },
        });
    }

    async findStaffById(idStaff: string) {
        const staff = await this.prismaService.client.staff.findUnique({
            where: {
                idStaff,
            },
            select: {
                idStaff: true,
                userId: true,
                staffNumber: true,
                position: true,
                specialty: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                        mobileNumber: true,
                        role: true,
                    },
                },
            },
        });

        if (!staff) {
            throw new NotFoundException('Staff member not found');
        }

        return staff;
    }

    async updateStaff(
        idStaff: string,
        updateStaffDto: UpdateStaffDto,
    ) {
        const staff = await this.prismaService.client.staff.findUnique({
            where: {
                idStaff,
            },
            select: {
                idStaff: true,
            },
        });

        if (!staff) {
            throw new NotFoundException('Staff member not found');
        }

        if (Object.keys(updateStaffDto).length === 0) {
            throw new BadRequestException(
                'At least one field must be provided',
            );
        }

        try {
            return await this.prismaService.client.staff.update({
                where: {
                    idStaff,
                },
                data: updateStaffDto,
                select: {
                    idStaff: true,
                    userId: true,
                    staffNumber: true,
                    position: true,
                    specialty: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
        } catch (error) {
            if (this.isUniqueConstraintError(error)) {
                throw new ConflictException(
                    'Staff number is already registered',
                );
            }

            throw error;
        }
    }

    async updateStaffStatus(
        idStaff: string,
        updateStaffStatusDto: UpdateStaffStatusDto,
    ) {
        const staff = await this.prismaService.client.staff.findUnique({
            where: {
                idStaff,
            },
            select: {
                idStaff: true,
            },
        });

        if (!staff) {
            throw new NotFoundException('Staff member not found');
        }

        return this.prismaService.client.staff.update({
            where: {
                idStaff,
            },
            data: {
                isActive: updateStaffStatusDto.isActive,
            },
            select: {
                idStaff: true,
                userId: true,
                staffNumber: true,
                position: true,
                specialty: true,
                isActive: true,
                updatedAt: true,
            },
        });
    }
}