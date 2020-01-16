import { Queue, Job } from "bull";
import { Inject, Injectable } from "@nestjs/common";
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { InjectRepository } from "@nestjs/typeorm";
import { Car } from "./car.entity";
import { Repository, Connection } from "typeorm";


@Processor('car')
@Injectable()
export class JobsService {
  constructor(@InjectQueue('car') private readonly queue: Queue, private readonly connection: Connection) {}

  createJob() : Promise<Job<any>> {
    return this.queue.add({});
  }

  @Process()
  processJob(job: Job<any>) : Promise<any> {
    return this.connection.transaction(
      entityManager => entityManager.query('update car set discountedPrice = true, price = (price * ?) where discountedPrice = false and firstRegistrationDate <= ? and firstRegistrationDate < ?', [0.8, new Date(), new Date()]).then(() => entityManager.query(''))
    );
  }
}