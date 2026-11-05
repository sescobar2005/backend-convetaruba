import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module.js';
import { AppJwtModule } from '../jwt/jwt.module.js';

import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles/roles.guard.js';

import { ReviewsController } from './reviews.controller.js';
import { ReviewsService } from './reviews.service.js';

@Module({
    imports: [
        PrismaModule,
        AppJwtModule,
    ],
    controllers: [
        ReviewsController,
    ],
    providers: [
        ReviewsService,
        JwtAuthGuard,
        RolesGuard,
    ],
})
export class ReviewsModule {}