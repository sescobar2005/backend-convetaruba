import { IsBoolean } from 'class-validator';

export class UpdateBranchServiceStatusDto {
    @IsBoolean()
    isActive: boolean;
}