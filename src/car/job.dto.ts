import { ApiProperty } from '@nestjs/swagger';
import { JobStatus } from 'bull';

/**
 * The job's price discount criteria
 */
export class JobPriceDiscountCriteriaDto {
  @ApiProperty()
  rate: number;
  @ApiProperty()
  carsWithFirstRegistrationDateAfter: Date;
  @ApiProperty()
  carsWithFirstRegistrationDateBefore: Date;
}

/**
 * The job's criteria
 */
export class JobCriteriaDto {
  @ApiProperty()
  priceDiscount: JobPriceDiscountCriteriaDto;
  @ApiProperty()
  removeOwnersWithPurchaseDateBefore: Date;
}

/**
 * The job's result
 */
export class JobResultDto {
  @ApiProperty()
  discountedPrices: number;

  @ApiProperty()
  removedOwners: number;
}

export class JobDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  criteria: JobCriteriaDto;

  @ApiProperty()
  status: JobStatus;

  @ApiProperty()
  progress: number;

  /**
   * How many attempts where made to run this job
   */
  @ApiProperty()
  attemptsMade: number;

  /**
   * When this job was started (unix milliseconds)
   */
  @ApiProperty()
  processedAt: Date;

  /**
   * When this job was completed (unix milliseconds)
   */
  @ApiProperty()
  finishedAt: Date;

  @ApiProperty()
  result?: JobResultDto;
}
