import {
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';

export class CreateBranchDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(120)
    slug: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    address: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    city: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    department: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsEmail()
    @IsOptional()
    email?: string;
}