import {
  InjectQueue,
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
  Process,
  Processor
} from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AssertionError } from 'assert';
import { Job, Queue } from 'bull';
import { Between, LessThan, Repository } from 'typeorm';
import { Car } from './car.entity';
import { JobCriteriaDto, JobDto, JobResultDto } from './job.dto';
import { Owner } from './owner.entity';

const monthMillis = 2592000000;
const priceDiscountNumberOfMonthUpperBound = 12;
const priceDiscountNumberOfMonthLowerBound = 18;
const removeOwnersNumberOfMonthUpperBound = 18;
const defaultPriceDiscountRate = 0.2;
const jobMinProgress = 0;
const jobMaxProgress = 100;
const noopJobResult: JobResultDto = {
  discountedPrices: 0,
  removedOwners: 0
};

/**
 * The job progress
 */
class JobProgress {
  private processed: number = 0;
  private discountedPrices: number = 0;
  private removedOwners: number = 0;
  private readonly maxProcessed: number;
  constructor(
    private readonly pricesToDiscount: number,
    private readonly ownersToRemove: number
  ) {
    this.maxProcessed = pricesToDiscount + ownersToRemove;
  }

  /**
   * @returns true if nothing to process else false
   */
  empty(): boolean {
    return this.maxProcessed < 1;
  }

  /**
   * Increments discounted prices counter
   */
  incrementDiscountedPrices(): JobProgress {
    this.processed++;
    this.discountedPrices++;
    return this;
  }

  /**
   * Increments removed owners counter
   */
  incrementRemovedOwners(): JobProgress {
    this.processed++;
    this.removedOwners++;
    return this;
  }

  /**
   * Returns the progress value [0, 100]
   */
  value(): number {
    if (this.maxProcessed === 0) {
      return jobMaxProgress;
    }
    if (this.processed === 0) {
      return jobMinProgress;
    }
    return Math.min(
      jobMaxProgress,
      Math.max(
        (1 - this.processed / this.maxProcessed) * jobMaxProgress,
        jobMinProgress
      )
    );
  }

  /**
   * Returns the job result
   */
  result(): JobResultDto {
    if (this.discountedPrices !== this.pricesToDiscount) {
      throw new AssertionError({
        message: 'Discounted prices mismatch',
        expected: this.pricesToDiscount,
        actual: this.discountedPrices
      });
    }
    if (this.removedOwners !== this.ownersToRemove) {
      throw new AssertionError({
        message: 'Removed owners mismatch',
        expected: this.ownersToRemove,
        actual: this.removedOwners
      });
    }
    return {
      discountedPrices: this.discountedPrices,
      removedOwners: this.removedOwners
    };
  }
}

/**
 * The jobs service.
 */
@Processor('car')
@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Car) private readonly carRepository: Repository<Car>,
    @InjectRepository(Owner)
    private readonly ownerRepository: Repository<Owner>,
    @InjectQueue('car') private readonly queue: Queue<JobCriteriaDto>
  ) {}

  /**
   * Adds month(s) to a timestamp in millis
   * @param timestamp the timestamp in millis to add month(s) to
   * @param count the number of month to add
   * @returns a timestamp in millis with count month(s) added
   */
  static addMonth(timestamp: number, count: number): number {
    return timestamp + count * monthMillis;
  }

  private static async jobToDto(job: Job<JobCriteriaDto>): Promise<JobDto> {
    return {
      id: job.id.toString(),
      criteria: job.data,
      createdAt: new Date(job.timestamp),
      status: await job.getState(),
      progress: await job.progress(),
      processedAt: new Date(job.processedOn),
      finishedAt: new Date(job.finishedOn),
      attemptsMade: job.attemptsMade,
      result: job.returnvalue
    };
  }

  private static createJobCriteria(): JobCriteriaDto {
    const currentTimeMillis = Date.now();
    return {
      priceDiscount: {
        rate: defaultPriceDiscountRate,
        carsWithFirstRegistrationDateAfter: new Date(
          JobsService.addMonth(
            currentTimeMillis,
            -priceDiscountNumberOfMonthLowerBound
          )
        ),
        carsWithFirstRegistrationDateBefore: new Date(
          JobsService.addMonth(
            currentTimeMillis,
            -priceDiscountNumberOfMonthUpperBound
          )
        )
      },
      removeOwnersWithPurchaseDateBefore: new Date(
        JobsService.addMonth(
          currentTimeMillis,
          -removeOwnersNumberOfMonthUpperBound
        )
      )
    };
  }

  private jobApplyCarPriceDiscount(
    job: Job<JobCriteriaDto>,
    progress: JobProgress
  ): (car: Car) => Promise<void> {
    const priceDiscountRate = job.data.priceDiscount.rate;
    return async (car: Car): Promise<void> => {
      car.price *= 1 - priceDiscountRate;
      car.priceDiscounted = true;
      return this.carRepository
        .save(car)
        .then(() => job.progress(progress.incrementDiscountedPrices().value()));
    };
  }

  private jobRemoveOwner(
    job: Job<JobCriteriaDto>,
    progress: JobProgress
  ): (owner: Owner) => void {
    return async (owner: Owner): Promise<void> => {
      return this.ownerRepository
        .delete(owner)
        .then(() => job.progress(progress.incrementRemovedOwners().value()));
    };
  }

  /**
   * Creates a job
   * @returns the added job
   */
  async createJob(): Promise<JobDto> {
    return this.queue
      .add(JobsService.createJobCriteria(), {})
      .then(job => JobsService.jobToDto(job));
  }

  /**
   * Lists all jobs
   * @returns all jobs
   */
  async listJobs(): Promise<Array<JobDto>> {
    return this.queue
      .getJobs([])
      .then(jobs => Promise.all(jobs.map(job => JobsService.jobToDto(job))));
  }

  /**
   * Retreives on job with given id
   * @param id the requested job id
   */
  async getOneJob(id: string): Promise<JobDto> {
    return this.queue.getJob(id).then(job => JobsService.jobToDto(job));
  }

  @Process()
  protected async processJob(job: Job<JobCriteriaDto>): Promise<JobResultDto> {
    const criteria = job.data;
    const carsAndCount = await this.carRepository.findAndCount({
      where: {
        priceDiscounted: false,
        firstRegistrationDate: Between(
          criteria.priceDiscount.carsWithFirstRegistrationDateAfter,
          criteria.priceDiscount.carsWithFirstRegistrationDateBefore
        )
      }
    });
    const ownersAndCount = await this.ownerRepository.findAndCount({
      where: {
        purchaseDate: LessThan(criteria.removeOwnersWithPurchaseDateBefore)
      }
    });
    const progress = new JobProgress(carsAndCount[1], ownersAndCount[1]);
    if (progress.empty()) {
      return job.progress(jobMaxProgress).then(() => noopJobResult);
    }
    const applyCarPriceDiscount = this.jobApplyCarPriceDiscount(job, progress);
    const removeOwner = this.jobRemoveOwner(job, progress);
    return Promise.all(carsAndCount[0].map(applyCarPriceDiscount))
      .then(() => Promise.all(ownersAndCount[0].map(removeOwner)))
      .then(() => progress.result());
  }

  @OnQueueActive()
  protected onJobActive(job: Job): void {
    console.log('Car job [', job.id, '] started');
  }

  @OnQueueFailed()
  protected onJobFailed(job: Job, error: Error): void {
    console.log('Car job [', job.id, '] failed due to error:', error);
  }

  @OnQueueCompleted()
  protected onJobCompleted(job: Job, result: JobResultDto): void {
    console.log('Car job [', job.id, '] completed: ', result);
  }
}
