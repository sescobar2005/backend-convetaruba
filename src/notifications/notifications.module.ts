import { Module } from '@nestjs/common';

import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './notifications.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AppJwtModule } from '../jwt/jwt.module.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard.js';

@Module({
    imports: [PrismaModule, AppJwtModule],
    controllers: [NotificationsController],
    providers: [NotificationsService, JwtAuthGuard],
    exports: [NotificationsService],
})
export class NotificationsModule {}