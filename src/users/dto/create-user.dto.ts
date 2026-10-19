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
    @IsNotEmpty()
    mobileNumber: string;

    @IsString()
    @MinLength(12)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/)
    password: string;

    @IsBoolean()
    @Equals(true)
    acceptedTermsAndPrivacyPolicy: boolean;

    @IsBoolean()
    @IsOptional()
    whatsappReminders?: boolean;
}