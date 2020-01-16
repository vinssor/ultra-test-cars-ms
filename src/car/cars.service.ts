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
import { OrmCrudService } from '../orm/orm.crud-service';
import { Car } from './car.entity';
import { CarsErrorTransformer } from './cars.error-transformer';
import { JobCriteriaDto, JobDto, JobResultDto } from './job.dto';
import { Owner } from './owner.entity';

const monthMillis = 2592000000;
const twelveMonthMillis: number = 12 * monthMillis;
const eighteenMonthMillis: number = 18 * monthMillis;
const defaultPriceDiscountRate = 0.2;

/**
 * The job progress
 */
class JobProgress {
  private processed: number = 0;
  private discountedPrices: number = 0;
  private removedOwners: number = 0;
  constructor(private readonly of: number) {}

  /**
   * Increments discounted price counter
   */
  incrementDiscounted(): JobProgress {
    this.discountedPrices++;
    return this;
  }

  /**
   * Adds given count to removed owner counter
   */
  addRemovedOwners(count: number): JobProgress {
    if (count > 0) {
      this.discountedPrices += count;
    }
    return this;
  }

  /**
   * Increments processed car counter
   */
  increment(): JobProgress {
    this.processed++;
    return this;
  }

  /**
   * Returns the progress value [0, 100]
   */
  value(): number {
    if (this.of === 0) {
      return 100;
    }
    if (this.processed === 0) {
      return 0;
    }
    return Math.min(100, Math.max((1 - this.processed / this.of) * 100, 0));
  }

  /**
   * Returns the job result
   */
  result(): JobResultDto {
    if (this.processed !== this.of) {
      throw new AssertionError({
        message: 'Progress mismatch',
        expected: this.of,
        actual: this.processed
      });
    }
    return {
      processedCars: this.processed,
      discountedPrices: this.discountedPrices,
      removedOwners: this.removedOwners
    };
  }
}

/**
 * The cars service.
 */
@Processor('car')
@Injectable()
export class CarsService extends OrmCrudService<Car> {
  constructor(
    @InjectRepository(Car) repo: Repository<Car>,
    errorTransformer: CarsErrorTransformer,
    @InjectQueue('car') private readonly queue: Queue<JobCriteriaDto>
  ) {
    super(repo, errorTransformer);
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
      priceDiscountRate: defaultPriceDiscountRate,
      discountCarsWithFirstRegistrationDateAfter: new Date(
        currentTimeMillis - eighteenMonthMillis
      ),
      discountCarsWithFirstRegistrationDateBefore: new Date(
        currentTimeMillis - twelveMonthMillis
      ),
      removeOwnersWithPurchaseDateBefore: new Date(
        currentTimeMillis - eighteenMonthMillis
      )
    };
  }

  private static jobOwnersToKeep(
    jobCriteria: JobCriteriaDto,
    jobProgress: JobProgress
  ): (car: Car) => Owner[] {
    return (car: Car) => {
      const initialSize = car.owners.length;
      const result = car.owners.filter(
        owner =>
          owner.purchaseDate >= jobCriteria.removeOwnersWithPurchaseDateBefore
      );
      jobProgress.addRemovedOwners(initialSize - result.length);
      return result;
    };
  }

  private static jobIsCarToApplyPriceDiscount(
    jobCriteria: JobCriteriaDto
  ): (car: Car) => boolean {
    return (car: Car) =>
      !car.priceDiscountApplied &&
      jobCriteria.discountCarsWithFirstRegistrationDateAfter <
        car.firstRegistrationDate &&
      car.firstRegistrationDate >
        jobCriteria.discountCarsWithFirstRegistrationDateBefore;
  }

  private static jobApplyCarPriceDiscount(
    jobCriteria: JobCriteriaDto,
    jobProgress: JobProgress
  ): (car: Car) => number {
    const isCarToApplyPriceDiscount: (
      car: Car
    ) => boolean = this.jobIsCarToApplyPriceDiscount(jobCriteria);
    return (car: Car) => {
      if (isCarToApplyPriceDiscount(car)) {
        jobProgress.incrementDiscounted();
        return car.price * (1 - jobCriteria.priceDiscountRate);
      }
      return car.price;
    };
  }

  /**
   * Creates a job
   * @returns the added job
   */
  async createJob(): Promise<JobDto> {
    return this.queue
      .add(CarsService.createJobCriteria(), {})
      .then(job => CarsService.jobToDto(job));
  }

  /**
   * Lists all jobs
   * @returns all jobs
   */
  async listJobs(): Promise<Array<JobDto>> {
    return this.queue
      .getJobs([])
      .then(jobs => Promise.all(jobs.map(job => CarsService.jobToDto(job))));
  }

  /**
   * Retreives on job with given id
   * @param id the requested job id
   */
  async getOneJob(id: string): Promise<JobDto> {
    return this.queue.getJob(id).then(job => CarsService.jobToDto(job));
  }

  @Process()
  protected async processJob(job: Job<JobCriteriaDto>): Promise<JobResultDto> {
    const criteria = job.data;
    return this.repo
      .createQueryBuilder('car')
      .leftJoinAndSelect('car.owners', 'owner')
      .where({
        priceDiscountApplied: false,
        firstRegistrationDate: Between(
          criteria.discountCarsWithFirstRegistrationDateAfter,
          criteria.discountCarsWithFirstRegistrationDateBefore
        )
      })
      .orWhere(
        'owner.purchaseDate',
        LessThan(criteria.removeOwnersWithPurchaseDateBefore)
      )
      .getManyAndCount()
      .then(async carsAnCount => {
        const count = carsAnCount[1];
        if (count < 1) {
          return job.progress(100).then(() => ({
            processedCars: 0,
            discountedPrices: 0,
            removedOwners: 0
          }));
        }
        const progress = new JobProgress(count);
        const applyCarPriceDiscount: (
          car: Car
        ) => number = CarsService.jobApplyCarPriceDiscount(criteria, progress);
        const ownersToKeep: (car: Car) => Owner[] = CarsService.jobOwnersToKeep(
          criteria,
          progress
        );
        const updateCar: (car: Car) => Promise<void> = async (
          car: Car
        ): Promise<void> => {
          car.price = applyCarPriceDiscount(car);
          car.owners = ownersToKeep(car);
          return this.repo
            .save(car)
            .then(() => job.progress(progress.increment().value()));
        };
        return Promise.all(carsAnCount[0].map(updateCar)).then(progress.result);
      });
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
    console.log(
      'Car job [',
      job.id,
      '] completed for [',
      result.processedCars,
      '] cars'
    );
  }
}
