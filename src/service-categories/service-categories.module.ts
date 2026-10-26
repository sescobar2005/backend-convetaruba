
import { Module } from '@nestjs/common';
import { ServiceCategoriesController } from './service-categories.controller.js';
import { ServiceCategoriesService } from './service-categories.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AppJwtModule } from '../jwt/jwt.module.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles/roles.guard.js';

@Module({
    imports: [PrismaModule, AppJwtModule],
    controllers: [ServiceCategoriesController],
    providers: [
        ServiceCategoriesService,
        JwtAuthGuard,
        RolesGuard,
    ],
    exports: [ServiceCategoriesService],
})
export class ServiceCategoriesModule {}
