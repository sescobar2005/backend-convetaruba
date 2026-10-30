import { IsUUID } from 'class-validator';

export class AssignStaffBranchDto {
  @IsUUID()
  branchId: string;
}