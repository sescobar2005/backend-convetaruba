import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';

import jwtConfig from '../config/jwt.config.js';
import { UsersModule } from '../users/users.module.js';
import { AppJwtModule } from '../jwt/jwt.module.js';

@Module({
  imports: [UsersModule, AppJwtModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
