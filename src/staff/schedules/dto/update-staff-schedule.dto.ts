import {
    IsEnum,
    IsOptional,
    IsString,
    Matches,
} from 'class-validator';

import { WeekDay } from '../../../../generated/prisma/client.js';

export class UpdateStaffScheduleDto {
    @IsEnum(WeekDay)
    @IsOptional()
    weekDay?: WeekDay;

    @IsString()
    @IsOptional()
    @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
        message: 'Start time must use the HH:mm format',
    })
    startsAt?: string;

    @IsString()
    @IsOptional()
    @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
        message: 'End time must use the HH:mm format',
    })
    endsAt?: string;
}