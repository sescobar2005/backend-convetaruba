import {
    IsEnum,
    IsNotEmpty,
    IsString,
    MaxLength,
} from 'class-validator';

import { NotificationType } from '../../../generated/prisma/enums.js';

export class CreateNotificationDto {
    @IsEnum(NotificationType)
    type: NotificationType;

    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    title: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(1000)
    message: string;
}