import { Module } from '@nestjs/common';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AppJwtModule } from '../jwt/jwt.module.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard.js';

@Module({
  imports: [PrismaModule, AppJwtModule],
  controllers: [UsersController],
  providers: [UsersService, JwtAuthGuard],
  exports: [UsersService],
})
export class UsersModule {}
