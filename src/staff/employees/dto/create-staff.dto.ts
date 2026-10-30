import {
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
} from 'class-validator';

import { StaffPosition } from '../../../../generated/prisma/client.js';

export class CreateStaffDto {
    @IsUUID()
    @IsNotEmpty()
    userId: string;

    @IsString()
    @IsNotEmpty()
    staffNumber: string;

    @IsEnum(StaffPosition)
    position: StaffPosition;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    specialty?: string;
}