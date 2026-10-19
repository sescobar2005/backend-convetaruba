import {
    IsString,
    Matches,
    MinLength
} from 'class-validator';

export class ChangePasswordDto {
    @IsString()
    @MinLength(1)
    currentPassword!: string;

    @IsString()
    @MinLength(12)
    @Matches(/[A-Z]/, {
        message: 'New password must contain at least one uppercase letter',
    })
    @Matches(/[0-9]/, {
        message: 'New password must contain at least one number',
    })
    @Matches(/[^A-Za-z0-9]/, {
        message: 'New password must contain at least one symbol',
    })
    newPassword!: string;
}