import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateServiceCategoryDto {
    @IsString()
    @MinLength(2)
    @MaxLength(80)
    name!: string;

    @IsString()
    @MinLength(2)
    @MaxLength(100)
    @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
        message: 'Slug must contain lowercase letters, numbers and single hyphens only',
    })
    slug!: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    description?: string;
}