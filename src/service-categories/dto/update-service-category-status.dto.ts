import { IsBoolean } from 'class-validator';

export class UpdateServiceCategoryStatusDto {
    @IsBoolean()
    isActive: boolean;
}