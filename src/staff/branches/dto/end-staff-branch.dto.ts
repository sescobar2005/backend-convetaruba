import { IsDateString, IsOptional } from 'class-validator';

export class EndStaffBranchDto {
  @IsOptional()
  @IsDateString()
  endDate?: string;
}