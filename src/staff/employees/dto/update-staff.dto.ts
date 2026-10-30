import {
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
} from 'class-validator';

import { StaffPosition } from '../../../../generated/prisma/client.js';

export class UpdateStaffDto {
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    staffNumber?: string;

    @IsEnum(StaffPosition)
    @IsOptional()
    position?: StaffPosition;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    specialty?: string;
}