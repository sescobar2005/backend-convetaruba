import { Type } from 'class-transformer';
import {
    IsNumber,
    IsPositive,
    Max,
    Min,
} from 'class-validator';

export class UpdateBranchServicePriceDto {
    @Type(() => Number)
    @IsNumber({
        maxDecimalPlaces: 2,
    })
    @IsPositive()
    @Min(0.01)
    @Max(9999999999.99)
    amount: number;
}