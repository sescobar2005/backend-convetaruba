import { IsBoolean } from 'class-validator';

export class UpdateBranchStatusDto {
    @IsBoolean()
    isActive: boolean;
}