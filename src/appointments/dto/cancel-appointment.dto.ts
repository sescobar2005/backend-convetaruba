import {
    IsString,
    Matches,
    MaxLength,
} from 'class-validator';

export class CancelAppointmentDto {
    @IsString()
    @Matches(/\S/, {
        message: 'Cancellation reason must contain at least one non-whitespace character',
    })
    @MaxLength(500)
    reason: string;
}