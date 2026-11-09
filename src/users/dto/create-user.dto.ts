import {
    IsString,
    IsNotEmpty,
    IsBoolean,
    IsOptional,
    Equals,
    IsEmail,
    MinLength,
    Matches,
} from 'class-validator';

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @IsString()
    @IsNotEmpty()
    lastName: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    mobileNumber: string;

    @IsString()
    @MinLength(6, {
        message: 'Password must be at least 6 characters long',
    })
    @Matches(/^(?=.*[A-Z])(?=.*(?:\d|[^A-Za-z0-9\s])).+$/, {
        message: 'Password must contain at least one uppercase letter and one number or symbol',
    })
    password: string;

    @IsBoolean()
    @Equals(true)
    acceptedTermsAndPrivacyPolicy: boolean;

    @IsBoolean()
    @IsOptional()
    whatsappReminders?: boolean;
}