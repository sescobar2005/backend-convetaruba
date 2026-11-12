import { IsBoolean } from 'class-validator';

export class UpdateStaffScheduleStatusDto {
    @IsBoolean()
    isActive: boolean;
}