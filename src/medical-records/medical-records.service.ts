import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { Role, StaffPosition } from '../../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';

import { MedicalRecordQueryDto } from './dto/medical-record-query.dto.js';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto.js';

@Injectable()
export class MedicalRecordsService {
    constructor(
        private readonly prisma: PrismaService,
    ) {}

    private async getVeterinarianStaff(userId: string) {
        const staff = await this.prisma.client.staff.findUnique({
            where: {
                userId,
            },
            select: {
                idStaff: true,
                position: true,
                isActive: true,
            },
        });

        if (
            !staff ||
            !staff.isActive ||
            staff.position !== StaffPosition.VETERINARIAN
        ) {
            throw new ForbiddenException(
                'Only active veterinarians can access clinical records',
            );
        }

        return staff;
    }

    private async authorizeRecordAccess(
        userId: string,
        role: Role,
        record: {
            veterinarianId: string;
            pet: {
                ownerId: string;
            };
        },
        canModify = false,
    ) {
        if (role === Role.ADMIN) {
            return;
        }

        if (role === Role.CUSTOMER) {
            if (canModify || record.pet.ownerId !== userId) {
                throw new ForbiddenException(
                    'You are not authorized to access this medical record',
                );
            }

            return;
        }

        if (role === Role.STAFF) {
            const staff = await this.getVeterinarianStaff(userId);

            if (staff.idStaff !== record.veterinarianId) {
                throw new ForbiddenException(
                    'You are not authorized to access this medical record',
                );
            }

            return;
        }

        throw new ForbiddenException(
            'You are not authorized to access medical records',
        );
    }

    async findById(
        medicalRecordId: string,
        requestingUserId: string,
        requestingUserRole: Role,
    ) {
        const medicalRecord =
            await this.prisma.client.medicalRecord.findUnique({
                where: {
                    idMedicalRecord: medicalRecordId,
                },
                include: {
                    pet: {
                        select: {
                            idPet: true,
                            name: true,
                            ownerId: true,
                        },
                    },
                    veterinarian: {
                        include: {
                            user: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                },
                            },
                        },
                    },
                    appointment: {
                        select: {
                            idAppointment: true,
                            startsAt: true,
                            completedAt: true,
                            branch: {
                                select: {
                                    idBranch: true,
                                    name: true,
                                },
                            },
                            branchService: {
                                include: {
                                    service: true,
                                },
                            },
                        },
                    },
                },
            });

        if (!medicalRecord) {
            throw new NotFoundException('Medical record not found');
        }

        await this.authorizeRecordAccess(
            requestingUserId,
            requestingUserRole,
            medicalRecord,
        );

        return medicalRecord;
    }

    async findByPetId(
        petId: string,
        requestingUserId: string,
        requestingUserRole: Role,
        filters: MedicalRecordQueryDto,
    ) {
        const pet = await this.prisma.client.pet.findUnique({
            where: {
                idPet: petId,
            },
            select: {
                idPet: true,
                ownerId: true,
            },
        });

        if (!pet) {
            throw new NotFoundException('Pet not found');
        }

        let veterinarianId: string | undefined;

        if (requestingUserRole === Role.CUSTOMER) {
            if (pet.ownerId !== requestingUserId) {
                throw new ForbiddenException(
                    'You are not authorized to access this pet medical history',
                );
            }
        } else if (requestingUserRole === Role.STAFF) {
            const staff = await this.getVeterinarianStaff(requestingUserId);

            veterinarianId = staff.idStaff;
        } else if (requestingUserRole !== Role.ADMIN) {
            throw new ForbiddenException(
                'You are not authorized to access medical records',
            );
        }

        const page = filters.page;
        const limit = filters.limit;
        const skip = (page - 1) * limit;

        const where = {
            petId,
            ...(veterinarianId && {
                veterinarianId,
            }),
        };

        const [data, total] = await this.prisma.client.$transaction([
            this.prisma.client.medicalRecord.findMany({
                where,
                include: {
                    veterinarian: {
                        include: {
                            user: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                },
                            },
                        },
                    },
                    appointment: {
                        select: {
                            idAppointment: true,
                            startsAt: true,
                            completedAt: true,
                            branch: {
                                select: {
                                    name: true,
                                },
                            },
                            branchService: {
                                include: {
                                    service: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip,
                take: limit,
            }),

            this.prisma.client.medicalRecord.count({
                where,
            }),
        ]);

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async update(
        medicalRecordId: string,
        requestingUserId: string,
        requestingUserRole: Role,
        dto: UpdateMedicalRecordDto,
    ) {
        const medicalRecord =
            await this.prisma.client.medicalRecord.findUnique({
                where: {
                    idMedicalRecord: medicalRecordId,
                },
                select: {
                    idMedicalRecord: true,
                    veterinarianId: true,
                    pet: {
                        select: {
                            ownerId: true,
                        },
                    },
                },
            });

        if (!medicalRecord) {
            throw new NotFoundException('Medical record not found');
        }

        await this.authorizeRecordAccess(
            requestingUserId,
            requestingUserRole,
            medicalRecord,
            true,
        );

        const fields = Object.keys(dto);

        if (fields.length === 0) {
            throw new BadRequestException(
                'At least one medical record field must be provided',
            );
        }

        const data = {
            ...(dto.observations !== undefined && {
                observations: dto.observations.trim(),
            }),
            ...(dto.diagnosis !== undefined && {
                diagnosis: dto.diagnosis.trim(),
            }),
            ...(dto.treatment !== undefined && {
                treatment: dto.treatment.trim(),
            }),
            ...(dto.recommendations !== undefined && {
                recommendations: dto.recommendations.trim(),
            }),
        };

        return this.prisma.client.medicalRecord.update({
            where: {
                idMedicalRecord: medicalRecordId,
            },
            data,
            include: {
                pet: {
                    select: {
                        idPet: true,
                        name: true,
                    },
                },
                veterinarian: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
        });
    }
}