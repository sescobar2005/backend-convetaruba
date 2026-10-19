import {
    IsEmail,
    IsString,
} from 'class-validator';
import { Transform } from 'class-transformer'

export class UpdateEmailDto {
    @Transform(({ value }) => 
        typeof value === 'string' ? value.trim().toLowerCase() : value,
    )
    @IsEmail()
    email!: string;
}