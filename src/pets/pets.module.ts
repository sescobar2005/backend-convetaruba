import { Module } from '@nestjs/common';
import { PetsService } from './pets.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PetsController } from './pets.controller.js';
import { AppJwtModule } from '../jwt/jwt.module.js';

  @Module({
    imports: [PrismaModule, AppJwtModule],
    providers: [PetsService],
    controllers: [PetsController],
    exports: [PetsService]
  })
  export class PetsModule {}
