import { IsIn } from 'class-validator';
import { ReviewStatus } from '../../../generated/prisma/enums.js';

export class ModerateReviewDto {
    @IsIn([ReviewStatus.APPROVED, ReviewStatus.HIDDEN])
    status: ReviewStatus;
}