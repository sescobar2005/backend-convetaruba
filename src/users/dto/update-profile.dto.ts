import {
    IsBoolean,
    IsString,
    MinLength,
    ValidateIf
} from 'class-validator';

export class UpdateProfileDto {
    @ValidateIf((_object, value) => value !== undefined)
    @IsString()
    @MinLength(2)
    firstName?: string;

    @ValidateIf((_object, value) => value !== undefined)
    @IsString()
    @MinLength(2)
    lastName?: string;

    @ValidateIf((_object, value) => value !== undefined)
    @IsString()
    @MinLength(7)
    mobileNumber?: string;

    @ValidateIf((_object, value) => value !== undefined)
    @IsBoolean()
    whatsappReminders?: boolean;
}