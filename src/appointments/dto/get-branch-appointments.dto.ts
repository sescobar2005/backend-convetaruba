import {
    IsDateString,
    IsEnum,
    IsOptional,
    Matches,
} from 'class-validator';

import { AppointmentStatus } from '../../../generated/prisma/enums.js';

export class GetBranchAppointmentsDto {
    @IsOptional()
    @IsDateString()
    @Matches(/^\d{4}-\d{2}-\d{2}$/, {
        message: 'Date must use the YYYY-MM-DD format',
    })
    date?: string;

    @IsOptional()
    @IsEnum(AppointmentStatus)
    status?: AppointmentStatus;
}