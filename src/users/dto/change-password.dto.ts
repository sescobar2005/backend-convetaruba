import {
    IsString,
    Matches,
    MinLength,
} from 'class-validator';

export class ChangePasswordDto {
    @IsString()
    @MinLength(1)
    currentPassword!: string;

    @IsString()
    @MinLength(6, {
        message: 'New password must be at least 6 characters long',
    })
    @Matches(/^(?=.*[A-Z])(?=.*(?:\d|[^A-Za-z0-9\s])).+$/, {
        message: 'New password must contain at least one uppercase letter and one number or symbol',
    })
    newPassword!: string;
}