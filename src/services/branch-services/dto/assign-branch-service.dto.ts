import { IsUUID } from 'class-validator';

export class AssignBranchServiceDto {
    @IsUUID()
    serviceId: string;
}