import { Type } from 'class-transformer';
import {
    IsEnum,
    IsInt,
    IsOptional,
    Max,
    Min,
} from 'class-validator';

import { ReviewStatus } from '../../../generated/prisma/enums.js';

export class ReviewQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit: number = 10;

    @IsOptional()
    @IsEnum(ReviewStatus)
    status?: ReviewStatus;
}