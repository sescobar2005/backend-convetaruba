import { IsUUID } from 'class-validator';

export class ChangeVeterinarianDto {
    @IsUUID()
    veterinarianId: string;
}