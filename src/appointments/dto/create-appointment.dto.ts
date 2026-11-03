import {
    IsDateString,
    IsOptional,
    IsString,
    IsUUID,
    Matches,
    MaxLength,
} from 'class-validator';

export class CreateAppointmentDto {
    @IsUUID()
    petId: string;

    @IsUUID()
    branchId: string;

    @IsUUID()
    branchServiceId: string;

    @IsUUID()
    veterinarianId: string;

    @IsDateString()
    startsAt: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    @Matches(/\S/, {
        message: 'Appointment notes must contain at least one non-whitespace character',
    })
    notes?: string;
}