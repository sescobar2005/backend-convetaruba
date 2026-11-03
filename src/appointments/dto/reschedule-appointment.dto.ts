import {
    IsDateString,
    IsUUID,
} from 'class-validator';

export class RescheduleAppointmentDto {
    @IsDateString()
    startsAt: string;

    @IsUUID()
    branchId: string;

    @IsUUID()
    veterinarianId: string;
}