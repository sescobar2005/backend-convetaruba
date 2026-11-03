import {
    IsDateString,
    IsUUID,
    Matches,
} from 'class-validator';

export class GetAppointmentAvailabilityDto {
    @IsUUID()
    branchId: string;

    @IsUUID()
    veterinarianId: string;

    @IsDateString()
    @Matches(/^\d{4}-\d{2}-\d{2}$/, {
        message: 'Date must use the YYYY-MM-DD format',
    })
    date: string;
}