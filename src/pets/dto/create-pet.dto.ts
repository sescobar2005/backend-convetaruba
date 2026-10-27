import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Matches
} from 'class-validator';
import { PetSex, PetSpecies } from '../../../generated/prisma/enums.js';

export class CreatePetDto {
  @IsString()
  @MinLength(1)
  @Matches(/\S/, {
    message: 'Pet name must contain at least one non-whitespace character',
  })
  @MaxLength(100)
  name: string;

  @IsEnum(PetSpecies)
  species: PetSpecies;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  breed?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  color?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsEnum(PetSex)
  sex?: PetSex;
}