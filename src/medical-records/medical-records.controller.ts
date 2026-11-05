import {
    Controller,
    Get,
    Patch,
    Param,
    Query,
    Body,
    Req,
    UseGuards,
    ParseUUIDPipe,
} from '@nestjs/common';

import type { Request } from 'express';

import { Role } from '../../generated/prisma/enums.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard.js';

import { MedicalRecordsService } from './medical-records.service.js';
import { MedicalRecordQueryDto } from './dto/medical-record-query.dto.js';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto.js';

interface AuthenticatedRequest extends Request {
    user: {
        sub: string;
        role: Role;
        tokenVersion: number;
    };
}

@Controller('medical-records')
@UseGuards(JwtAuthGuard)
export class MedicalRecordsController {
    constructor(
        private readonly medicalRecordsService: MedicalRecordsService,
    ) {}

    @Get(':idMedicalRecord')
    async findById(
        @Param('idMedicalRecord', ParseUUIDPipe) idMedicalRecord: string,
        @Req() request: AuthenticatedRequest,
    ) {
        return this.medicalRecordsService.findById(
            idMedicalRecord,
            request.user.sub,
            request.user.role,
        );
    }

    @Get('pet/:petId')
    async findByPetId(
        @Param('petId', ParseUUIDPipe) petId: string,
        @Query() filters: MedicalRecordQueryDto,
        @Req() request: AuthenticatedRequest,
    ) {
        return this.medicalRecordsService.findByPetId(
            petId,
            request.user.sub,
            request.user.role,
            filters,
        );
    }

    @Patch(':idMedicalRecord')
    async update(
        @Param('idMedicalRecord', ParseUUIDPipe) idMedicalRecord: string,
        @Body() dto: UpdateMedicalRecordDto,
        @Req() request: AuthenticatedRequest,
    ) {
        return this.medicalRecordsService.update(
            idMedicalRecord,
            request.user.sub,
            request.user.role,
            dto,
        );
    }
}