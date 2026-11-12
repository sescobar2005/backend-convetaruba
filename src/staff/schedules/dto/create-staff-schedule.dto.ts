import {
    IsEnum,
    IsNotEmpty,
    IsString,
    Matches,
    IsUUID
} from 'class-validator';

import { WeekDay } from '../../../../generated/prisma/client.js';

export class CreateStaffScheduleDto {

    @IsUUID()
    @IsNotEmpty()
    branchId: string;

    @IsEnum(WeekDay)
    weekDay: WeekDay;

    @IsString()
    @IsNotEmpty()
    @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
        message: 'Start time must use the HH:mm format',
    })
    startsAt: string;

    @IsString()
    @IsNotEmpty()
    @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
        message: 'End time must use the HH:mm format',
    })
    endsAt: string;
}