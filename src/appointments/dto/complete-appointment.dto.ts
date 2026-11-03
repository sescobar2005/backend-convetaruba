import {
    IsOptional,
    IsString,
    Matches,
    MaxLength,
} from 'class-validator';

export class CompleteAppointmentDto {
    @IsOptional()
    @IsString()
    @Matches(/\S/)
    @MaxLength(10000)
    observations?: string;

    @IsOptional()
    @IsString()
    @Matches(/\S/)
    @MaxLength(10000)
    diagnosis?: string;

    @IsOptional()
    @IsString()
    @Matches(/\S/)
    @MaxLength(10000)
    treatment?: string;

    @IsOptional()
    @IsString()
    @Matches(/\S/)
    @MaxLength(10000)
    recommendations?: string;
}