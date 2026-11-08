import { Module } from '@nestjs/common';

import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';

import { UsersModule } from '../users/users.module.js';
import { AppJwtModule } from '../jwt/jwt.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [UsersModule, AppJwtModule, PrismaModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}