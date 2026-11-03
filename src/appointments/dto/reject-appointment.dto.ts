import {
    IsString,
    Matches,
    MaxLength,
} from 'class-validator';

export class RejectAppointmentDto {
    @IsString()
    @Matches(/\S/, {
        message: 'Rejection reason must contain at least one non-whitespace character',
    })
    @MaxLength(500)
    reason: string;
}