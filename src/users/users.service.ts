import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import * as argon2 from 'argon2';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UpdateEmailDto } from './dto/update-email.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';

@Injectable()
export class UsersService {
    constructor(private prismaService: PrismaService) {}

    async findByEmail(email: string){
        return this.prismaService.client.user.findUnique({
            where: {
                email: email
            },
        });
    }

    async findById(idUser: string) {
        const user = await this.prismaService.client.user.findUnique({
            where: {
                idUser,
            },
            select: {
                idUser: true,
                firstName: true,
                lastName: true,
                email: true,
                mobileNumber: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                whatsappReminders: true,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    async createUser(createUserDto: CreateUserDto){
        const email = createUserDto.email;

        if (await this.findByEmail(email)) {
            throw new ConflictException('Email address is already registered');
        }

        const passwordHash = await argon2.hash(createUserDto.password);

        const role = "CUSTOMER";

        const user = await this.prismaService.client.user.create({
            data: {
                firstName: createUserDto.firstName,
                lastName: createUserDto.lastName,
                email,
                mobileNumber: createUserDto.mobileNumber,
                passwordHash,
                role,

                termsAcceptedAt: new Date(),
                termsVersion: '1.0',
                privacyPolicyAcceptedAt: new Date(),
                privacyPolicyVersion: '1.0',

                whatsappReminders: createUserDto.whatsappReminders ?? false,
            },
            select: {
                idUser: true,
                firstName: true,
                lastName: true,
                email: true,
                mobileNumber: true,
                role: true,
                createdAt: true,
            },
        });

        return user;

    }

    async updateProfile(idUser: string, dto: UpdateProfileDto) {
        const user = await this.prismaService.client.user.findUnique({
            where: { idUser },
            select: { idUser: true },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const data = {
            ...(dto.firstName !== undefined && {
                firstName: dto.firstName,
            }),
            ...(dto.lastName !== undefined && {
                lastName: dto.lastName,
            }),
            ...(dto.mobileNumber  !== undefined && {
                mobileNumber : dto.mobileNumber,
            }),
            ...(dto.whatsappReminders   !== undefined && {
                whatsappReminders  : dto.whatsappReminders,
            }),
        };

        if (Object.keys(data).length === 0) {
            throw new BadRequestException('At least one profile field must be provided');
        }

        return this.prismaService.client.user.update({
            where: { idUser },
            data,
            select: {
                idUser: true,
                firstName: true,
                lastName: true,
                email: true,
                mobileNumber: true,
                role: true,
                whatsappReminders: true,
                updatedAt: true,
            },
        });
    }

    async updateEmail(idUser: string, dto: UpdateEmailDto) {
        const user = await this.prismaService.client.user.findUnique({
            where: { idUser },
            select: { idUser: true }
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const existingEmail = await this.prismaService.client.user.findUnique({
            where: { email: dto.email },
            select: { idUser: true }
        });

        if (existingEmail && existingEmail.idUser !== idUser) {
            throw new ConflictException('Email is already in use');
        }

        try {
            return await this.prismaService.client.user.update({
            where: { idUser },
            data: { email: dto.email },
            select: {
                idUser: true,
                firstName: true,
                lastName: true,
                email: true,
                mobileNumber: true,
                role: true,
                updatedAt: true
            }
        });
        } catch (error: unknown) {
            if (
                typeof error === 'object' &&
                error !== null &&
                'code' in error &&
                error.code === 'P2002'
            ) {
                throw new ConflictException('Email is already in use');
            }

            throw error;
        }
    }

    async changePassword(idUser: string, dto: ChangePasswordDto){
        const user = await this.prismaService.client.user.findUnique({
            where: { idUser },
            select: {
                idUser: true,
                passwordHash: true
            }
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const isCurrentPasswordValid = await argon2.verify(
            user.passwordHash,
            dto.currentPassword
        );

        if (!isCurrentPasswordValid) {
            throw new BadRequestException('Current password is incorrect');
        }

        const newPasswordHash = await argon2.hash(dto.newPassword);

        await this.prismaService.client.user.update({
            where: { idUser },
            data: { 
                passwordHash: newPasswordHash,
                tokenVersion: {
                    increment: 1
                }
            }
        });

        return {
            message: 'Password changed successfully'
        };
    }

}
