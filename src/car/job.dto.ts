import { ApiProperty } from '@nestjs/swagger';
import { JobStatus } from 'bull';

/**
 * The job criteria
 */
export class JobCriteriaDto {
  @ApiProperty()
  priceDiscountRate: number;
  @ApiProperty()
  discountCarsWithFirstRegistrationDateAfter: Date;
  @ApiProperty()
  discountCarsWithFirstRegistrationDateBefore: Date;
  @ApiProperty()
  removeOwnersWithPurchaseDateBefore: Date;
}

export class JobResultDto {
  @ApiProperty()
  processedCars: number;

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

  /**
   * The custom data passed when the job was created
   */
  @ApiProperty()
  data: JobCriteriaDto;

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
