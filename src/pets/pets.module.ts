import { Module } from '@nestjs/common';
import { PetsService } from './pets.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PetsController } from './pets.controller.js';

  @Module({
    imports: [PrismaModule],
    providers: [PetsService],
    controllers: [PetsController],
    exports: [PetsService]
  })
  export class PetsModule {}
