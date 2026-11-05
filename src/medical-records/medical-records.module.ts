import { Module } from '@nestjs/common';

import { MedicalRecordsController } from './medical-records.controller.js';
import { MedicalRecordsService } from './medical-records.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AppJwtModule } from '../jwt/jwt.module.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard.js';

@Module({
    imports: [
        PrismaModule,
        AppJwtModule,
    ],
    controllers: [MedicalRecordsController],
    providers: [
        MedicalRecordsService,
        JwtAuthGuard,
    ],
    exports: [MedicalRecordsService],
})
export class MedicalRecordsModule {}