import { IsOptional, IsString, IsUUID, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateServiceDto {
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    name!: string;

    @IsString()
    @MinLength(2)
    @MaxLength(120)
    @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must contain lowercase letters, numbers and single hyphens only',
    })
    slug!: string;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    description?: string;

    @IsOptional()
    @IsString()
    @MaxLength(300)
    shortDescription?: string;

    @IsUUID()
    categoryId!: string;
}