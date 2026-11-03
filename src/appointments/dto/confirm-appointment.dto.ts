import {
    IsDateString,
} from 'class-validator';

export class ConfirmAppointmentDto {
    @IsDateString()
    endsAt: string;
}