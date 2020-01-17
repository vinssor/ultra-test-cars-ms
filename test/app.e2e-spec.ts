import { BullModule, InjectQueue, Processor } from '@nestjs/bull';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Job, Queue } from 'bull';
import * as request from 'supertest';
import { Connection, Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { Car } from '../src/car/car.entity';
import { JobCriteriaDto, JobResultDto } from '../src/car/job.dto';
import { JobsService } from '../src/car/jobs.service';
import { Owner } from '../src/car/owner.entity';
import { Manufacturer } from '../src/manufacturer/manufacturer.entity';

const clone = <T>(o: T): Partial<T> => {
  return { ...o, ...{} };
};

const cloneArray = <T>(o: T[]): Partial<T>[] => {
  const result: Partial<T>[] = [];
  o.forEach(element => result.push(clone(element)));
  return result;
};

const nowAddMonth = (count: number): Date => {
  return new Date(JobsService.addMonth(Date.now(), count));
};

@Processor('car')
class TestQueueProcessor {
  private activeHandlers: ((job: Job<JobCriteriaDto>) => any)[] = [];
  private completedHandlers: ((
    job: Job<JobCriteriaDto>,
    result: JobResultDto
  ) => any)[] = [];
  private failedHandlers: ((
    job: Job<JobCriteriaDto>,
    error: Error
  ) => any)[] = [];
  constructor(@InjectQueue('car') readonly queue: Queue<JobCriteriaDto>) {}

  addActiveHandler(handler: (job: Job<JobCriteriaDto>) => any): () => void {
    this.activeHandlers.push(handler);
    return () => {
      this.activeHandlers = this.activeHandlers.filter(
        currentHandler => currentHandler !== handler
      );
    };
  }

  addCompletedHandler(
    handler: (job: Job<JobCriteriaDto>, result: JobResultDto) => any
  ): () => void {
    this.completedHandlers.push(handler);
    return () => {
      this.completedHandlers = this.completedHandlers.filter(
        currentHandler => currentHandler !== handler
      );
    };
  }

  addFailedHandler(
    handler: (job: Job<JobCriteriaDto>, error: Error) => any
  ): () => void {
    this.failedHandlers.push(handler);
    return () => {
      this.failedHandlers = this.failedHandlers.filter(
        currentHandler => currentHandler !== handler
      );
    };
  }
}

describe('Cars (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;
  let manufacturerRepository: Repository<Manufacturer>;
  let carRepository: Repository<Car>;
  let ownerRepository: Repository<Owner>;
  let queueProcessor: TestQueueProcessor;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        BullModule.registerQueue({
          name: 'car',
          redis: {
            host: 'localhost',
            port: 16379
          }
        })
      ],
      providers: [TestQueueProcessor]
    }).compile();

    app = moduleFixture.createNestApplication();
    connection = moduleFixture.get<Connection>(Connection);
    manufacturerRepository = connection.getRepository(Manufacturer);
    carRepository = connection.getRepository(Car);
    ownerRepository = connection.getRepository(Owner);
    queueProcessor = moduleFixture.get<TestQueueProcessor>(TestQueueProcessor);
    await app.init();
  });

  beforeEach(async () => {
    // Clear DB before each test
    await connection.query('delete from owner');
    await connection.query('delete from car');
    await connection.query('delete from manufacturer');
    // Clean Queue before each test
    await queueProcessor.queue.clean(0);
  });

  describe('/manufacturers (GET)', () => {
    it('get empty list', () => {
      return request(app.getHttpServer())
        .get('/manufacturers')
        .expect(200)
        .expect([]);
    });
    it('get one', async () => {
      const manufacturer: Manufacturer = { id: '1', name: 'Test1' };
      await manufacturerRepository.save(manufacturer);
      return request(app.getHttpServer())
        .get('/manufacturers/1')
        .expect(200)
        .expect(manufacturer);
    });
    it('get many', async () => {
      const manufacturers: Manufacturer[] = [
        { id: '1', name: 'Test1' },
        { id: '2', name: 'Test2' },
        { id: '3', name: 'Test3' }
      ];
      await manufacturerRepository.save(manufacturers);
      return request(app.getHttpServer())
        .get('/manufacturers')
        .expect(200)
        .expect(manufacturers);
    });
  });

  describe('/manufacturers (POST)', () => {
    it('create one', () => {
      return request(app.getHttpServer())
        .post('/manufacturers')
        .send({ name: 'Test1' })
        .expect(201)
        .expect(res => (res.body.id = 'id'))
        .expect({ id: 'id', name: 'Test1', phone: null, siret: null });
    });
    it('create many', () => {
      return request(app.getHttpServer())
        .post('/manufacturers/bulk')
        .send({ bulk: [{ name: 'Test1' }, { name: 'Test2' }] })
        .expect(201)
        .expect(res =>
          res?.body?.forEach((element: any) => {
            element.id = 'id';
          })
        )
        .expect([
          { id: 'id', name: 'Test1', phone: null, siret: null },
          { id: 'id', name: 'Test2', phone: null, siret: null }
        ]);
    });
    it('create one with conflict', async () => {
      await manufacturerRepository.save({ id: '1', name: 'Test1' });
      return request(app.getHttpServer())
        .post('/manufacturers')
        .send({ name: 'Test1' })
        .expect(409);
    });
    it('create many with conflict', async () => {
      await manufacturerRepository.save([
        { id: '1', name: 'Test1' },
        { id: '2', name: 'Test2' },
        { id: '3', name: 'Test3' }
      ]);
      return request(app.getHttpServer())
        .post('/manufacturers/bulk')
        .send({ bulk: [{ name: 'Test2' }, { name: 'Test4' }] })
        .expect(409);
    });
  });

  describe('/manufacturers (PUT)', () => {
    it('create one', () => {
      return request(app.getHttpServer())
        .put('/manufacturers/1')
        .send({ name: 'Test1' })
        .expect(200)
        .expect({ id: '1', name: 'Test1', phone: null, siret: null });
    });
    it('create one with conflict', async () => {
      await manufacturerRepository.save({ id: '1', name: 'Test1' });
      return request(app.getHttpServer())
        .put('/manufacturers/2')
        .send({ name: 'Test1' })
        .expect(409);
    });
    it('replace one', async () => {
      await manufacturerRepository.save({ id: '1', name: 'Test1' });
      return request(app.getHttpServer())
        .put('/manufacturers/1')
        .send({ name: 'Test2' })
        .expect(200)
        .expect({ id: '1', name: 'Test2', phone: null, siret: null });
    });
    it('replace one with conflict', async () => {
      await manufacturerRepository.save([
        { id: '1', name: 'Test1' },
        { id: '2', name: 'Test2' },
        { id: '3', name: 'Test3' }
      ]);
      return request(app.getHttpServer())
        .put('/manufacturers/2')
        .send({ name: 'Test1' })
        .expect(409);
    });
  });

  describe('/cars (GET)', () => {
    it('get empty list', () => {
      return request(app.getHttpServer())
        .get('/cars')
        .expect(200)
        .expect([]);
    });
    it('get one', async () => {
      await manufacturerRepository.save({ id: '1', name: 'Test1' });
      const car: Car = {
        id: '1',
        manufacturerId: '1',
        price: 100,
        firstRegistrationDate: new Date(0),
        owners: [
          { id: '1', name: 'Test1', purchaseDate: new Date() },
          { id: '2', name: 'Test2', purchaseDate: new Date() }
        ]
      };
      await carRepository.save(clone(car));
      // No owner expected in response
      delete car.owners;
      return request(app.getHttpServer())
        .get('/cars/1')
        .expect(200)
        .expect(
          res =>
            (res.body.firstRegistrationDate = new Date(
              res.body.firstRegistrationDate
            ))
        )
        .expect(car);
    });
    it('get manufacturer', async () => {
      const manufacturer: Manufacturer = { id: '1', name: 'Test1' };
      await manufacturerRepository.save(manufacturer);
      await carRepository.save({
        id: '1',
        manufacturerId: '1',
        price: 100,
        firstRegistrationDate: new Date(0)
      });
      return request(app.getHttpServer())
        .get('/cars/1/manufacturer')
        .expect(200)
        .expect(manufacturer);
    });
    it('get many', async () => {
      await manufacturerRepository.save([
        { id: '1', name: 'Test1' },
        { id: '2', name: 'Test2' }
      ]);
      const cars: Car[] = [
        {
          id: '1',
          manufacturerId: '1',
          price: 100,
          firstRegistrationDate: new Date(0)
        },
        {
          id: '2',
          manufacturerId: '1',
          price: 200,
          firstRegistrationDate: new Date(0)
        },
        {
          id: '3',
          manufacturerId: '2',
          price: 300,
          firstRegistrationDate: new Date(0)
        }
      ];
      await carRepository.save(cloneArray(cars));
      return request(app.getHttpServer())
        .get('/cars')
        .expect(200)
        .expect(res =>
          res?.body?.forEach(
            (element: any) =>
              (element.firstRegistrationDate = new Date(
                element.firstRegistrationDate
              ))
          )
        )
        .expect(cars);
    });
  });

  describe('/cars (POST)', () => {
    it('create one', async () => {
      await manufacturerRepository.save({ id: '1', name: 'Test1' });
      const car = {
        manufacturerId: '1',
        price: 100,
        firstRegistrationDate: new Date(0),
        owners: [
          { id: '1', name: 'Test1', purchaseDate: new Date() },
          { id: '2', name: 'Test2', purchaseDate: new Date() }
        ]
      };
      const expectedCar = clone(car);
      // No owner expected in response
      delete expectedCar.owners;
      let carId: string;
      await request(app.getHttpServer())
        .post('/cars')
        .send(car)
        .expect(201)
        .expect(res => {
          carId = res.body.id;
          res.body.id = 'id';
          res.body.firstRegistrationDate = new Date(
            res.body.firstRegistrationDate
          );
        })
        .expect({ ...{ id: 'id' }, ...expectedCar });
      // Ckeck that owners are not stored
      const storedCar = await carRepository.findOneOrFail(carId);
      expect(storedCar).toBeDefined();
      expect(storedCar.owners?.length > 0).toBeFalsy();
    });
    it('create one with unknown manufacturer', async () => {
      await manufacturerRepository.save({ id: '1', name: 'Test1' });
      return request(app.getHttpServer())
        .post('/cars')
        .send({
          manufacturerId: '2',
          price: 100,
          firstRegistrationDate: new Date(0)
        })
        .expect(400);
    });
    it('create many', async () => {
      await manufacturerRepository.save({ id: '1', name: 'Test1' });
      const cars = [
        {
          id: '1',
          manufacturerId: '1',
          price: 100,
          firstRegistrationDate: new Date(0)
        },
        {
          id: '2',
          manufacturerId: '1',
          price: 200,
          firstRegistrationDate: new Date(0)
        },
        {
          id: '3',
          manufacturerId: '1',
          price: 300,
          firstRegistrationDate: new Date(0)
        }
      ];
      return request(app.getHttpServer())
        .post('/cars/bulk')
        .send({ bulk: cars })
        .expect(201)
        .expect(res => {
          let i = 0;
          res?.body?.forEach((element: any) => {
            element.id = (++i).toString();
            element.firstRegistrationDate = new Date(
              element.firstRegistrationDate
            );
          });
        })
        .expect(cars);
    });
    it('create many with unknown manufacturer', async () => {
      await manufacturerRepository.save({ id: '1', name: 'Test1' });
      return request(app.getHttpServer())
        .post('/cars/bulk')
        .send([
          {
            id: '1',
            manufacturerId: '1',
            price: 100,
            firstRegistrationDate: new Date(0)
          },
          {
            id: '2',
            manufacturerId: '1',
            price: 200,
            firstRegistrationDate: new Date(0)
          },
          {
            id: '3',
            manufacturerId: '2',
            price: 300,
            firstRegistrationDate: new Date(0)
          }
        ])
        .expect(400);
    });
  });

  describe('/cars (PUT)', () => {
    it('create one', async () => {
      const manufacturers: Manufacturer[] = [{ id: '1', name: 'Test1' }];
      await manufacturerRepository.save(manufacturers);
      const car = {
        manufacturerId: '1',
        price: 100,
        firstRegistrationDate: new Date(0),
        owners: [
          { id: '1', name: 'Test1', purchaseDate: new Date() },
          { id: '2', name: 'Test2', purchaseDate: new Date() }
        ]
      };
      const expectedCar = clone(car);
      // No owner expected in response
      delete expectedCar.owners;
      let carId: string;
      await request(app.getHttpServer())
        .put('/cars/1')
        .send(car)
        .expect(200)
        .expect(res => {
          carId = res.body.id;
          res.body.id = 'id';
          res.body.firstRegistrationDate = new Date(
            res.body.firstRegistrationDate
          );
        })
        .expect({ ...{ id: 'id' }, ...expectedCar });
      // Ckeck that owners are not stored
      const storedCar = await carRepository.findOneOrFail(carId);
      expect(storedCar).toBeDefined();
      expect(storedCar.owners?.length > 0).toBeFalsy();
    });
    it('create one with unknown manufacturer', async () => {
      await manufacturerRepository.save({ id: '1', name: 'Test1' });
      return request(app.getHttpServer())
        .put('/cars/1')
        .send({
          manufacturerId: '2',
          price: 100,
          firstRegistrationDate: new Date(0)
        })
        .expect(400);
    });
    it('replace one', async () => {
      await manufacturerRepository.save({ id: '1', name: 'Test1' });
      let car = {
        manufacturerId: '1',
        price: 100,
        firstRegistrationDate: new Date(0)
      };
      await carRepository.save({ ...{ id: '1' }, ...car });
      car.price = 200;
      // Expected car without owners
      const expectedCar = clone(car);
      car = {
        ...{
          owners: [
            { id: '1', name: 'Test1', purchaseDate: new Date() },
            { id: '2', name: 'Test2', purchaseDate: new Date() }
          ]
        },
        ...car
      };
      await request(app.getHttpServer())
        .put('/cars/1')
        .send(car)
        .expect(200)
        .expect(res => {
          res.body.firstRegistrationDate = new Date(
            res.body.firstRegistrationDate
          );
        })
        .expect({ ...{ id: '1' }, ...expectedCar });
      // Ckeck that owners are not stored
      const storedCar = await carRepository.findOneOrFail('1');
      expect(storedCar).toBeDefined();
      expect(storedCar.owners?.length > 0).toBeFalsy();
    });
    it('replace one with unknown manufacturer', async () => {
      await manufacturerRepository.save({ id: '1', name: 'Test1' });
      const car = {
        manufacturerId: '1',
        price: 100,
        firstRegistrationDate: new Date(0)
      };
      await carRepository.save({ ...{ id: '1' }, ...car });
      car.manufacturerId = '2';
      return request(app.getHttpServer())
        .put('/cars/1')
        .send(car)
        .expect(400);
    });
  });

  describe('/cars (DELETE)', () => {
    it('delete one', async () => {
      const manufacturers: Manufacturer[] = [{ id: '1', name: 'Test1' }];
      await manufacturerRepository.save(manufacturers);
      await carRepository.save({
        id: '1',
        manufacturerId: '1',
        price: 100,
        firstRegistrationDate: new Date(0),
        owners: [
          { id: '1', name: 'Test1', purchaseDate: new Date() },
          { id: '2', name: 'Test2', purchaseDate: new Date() }
        ]
      });
      await request(app.getHttpServer())
        .delete('/cars/1')
        .expect(200);
      // Ckeck that car is deleted
      return await expect(carRepository.findOneOrFail('1')).rejects.toThrow();
    });
    it('delete not found', async () => {
      await request(app.getHttpServer())
        .delete('/cars/1')
        .expect(404);
    });
  });

  describe('/cars/owners (GET)', () => {
    it('get one', async () => {
      await manufacturerRepository.save({ id: '1', name: 'Test1' });
      const owner1 = { id: '1', name: 'Test1', purchaseDate: new Date(0) };
      const owner2 = { id: '2', name: 'Test2', purchaseDate: new Date(0) };
      await carRepository.save({
        id: '1',
        manufacturerId: '1',
        price: 100,
        firstRegistrationDate: new Date(0),
        owners: [owner1, owner2]
      });
      await request(app.getHttpServer())
        .get('/cars/1/owners/1')
        .expect(200)
        .expect(
          res => (res.body.purchaseDate = new Date(res.body.purchaseDate))
        )
        .expect({ ...owner1, ...{ carId: '1' } });
      return await request(app.getHttpServer())
        .get('/cars/1/owners/2')
        .expect(200)
        .expect(
          res => (res.body.purchaseDate = new Date(res.body.purchaseDate))
        )
        .expect({ ...owner2, ...{ carId: '1' } });
    });
  });

  describe('/cars/owners (POST)', () => {
    it('create one', async () => {
      await manufacturerRepository.save({ id: '1', name: 'Test1' });
      const owner2 = { name: 'Test2', purchaseDate: new Date(0) };
      await carRepository.save({
        id: '1',
        manufacturerId: '1',
        price: 100,
        firstRegistrationDate: new Date(0),
        owners: [{ id: '1', name: 'Test1', purchaseDate: new Date(0) }]
      });
      return await request(app.getHttpServer())
        .post('/cars/1/owners')
        .send(owner2)
        .expect(201)
        .expect(res => {
          res.body.id = 'id';
          res.body.purchaseDate = new Date(res.body.purchaseDate);
        })
        .expect({ ...owner2, ...{ id: 'id', carId: '1' } });
    });
    it('create one name conflict', async () => {
      await manufacturerRepository.save({ id: '1', name: 'Test1' });
      const owner2 = { name: 'Test1', purchaseDate: new Date(0) };
      await carRepository.save({
        id: '1',
        manufacturerId: '1',
        price: 100,
        firstRegistrationDate: new Date(0),
        owners: [{ id: '1', name: 'Test1', purchaseDate: new Date(0) }]
      });
      return await request(app.getHttpServer())
        .post('/cars/1/owners')
        .send(owner2)
        .expect(409);
    });
  });

  describe('/cars/owners (PUT)', () => {
    it('create one', async () => {
      await manufacturerRepository.save({ id: '1', name: 'Test1' });
      const owner2 = { name: 'Test2', purchaseDate: new Date(0) };
      await carRepository.save({
        id: '1',
        manufacturerId: '1',
        price: 100,
        firstRegistrationDate: new Date(0),
        owners: [{ id: '1', name: 'Test1', purchaseDate: new Date(0) }]
      });
      return await request(app.getHttpServer())
        .put('/cars/1/owners/2')
        .send(owner2)
        .expect(200)
        .expect(res => {
          res.body.purchaseDate = new Date(res.body.purchaseDate);
        })
        .expect({ ...owner2, ...{ id: '2', carId: '1' } });
    });
    it('create one name conflict', async () => {
      await manufacturerRepository.save({ id: '1', name: 'Test1' });
      const owner2 = { name: 'Test1', purchaseDate: new Date(0) };
      await carRepository.save({
        id: '1',
        manufacturerId: '1',
        price: 100,
        firstRegistrationDate: new Date(0),
        owners: [{ id: '1', name: 'Test1', purchaseDate: new Date(0) }]
      });
      return await request(app.getHttpServer())
        .put('/cars/1/owners/2')
        .send(owner2)
        .expect(409);
    });
    it('replace one', async () => {
      await manufacturerRepository.save({ id: '1', name: 'Test1' });
      const owner2 = { name: 'Test2', purchaseDate: new Date(0) };
      await carRepository.save({
        id: '1',
        manufacturerId: '1',
        price: 100,
        firstRegistrationDate: new Date(0),
        owners: [
          { id: '1', name: 'Test1', purchaseDate: new Date(0) },
          {...{ id: '2'}, ...owner2 }
        ]
      });
      owner2.purchaseDate = new Date(10000);
      return await request(app.getHttpServer())
        .put('/cars/1/owners/2')
        .send(owner2)
        .expect(200)
        .expect(res => {
          res.body.purchaseDate = new Date(res.body.purchaseDate);
        })
        .expect({ ...owner2, ...{ id: '2', carId: '1' } });
    });
  });

  describe('/cars/owners (DELETE)', () => {
    it('delete one', async () => {
      const manufacturers: Manufacturer[] = [{ id: '1', name: 'Test1' }];
      await manufacturerRepository.save(manufacturers);
      await carRepository.save({
        id: '1',
        manufacturerId: '1',
        price: 100,
        firstRegistrationDate: new Date(0),
        owners: [
          { id: '1', name: 'Test1', purchaseDate: new Date() },
          { id: '2', name: 'Test2', purchaseDate: new Date() }
        ]
      });
      await request(app.getHttpServer())
        .delete('/cars/1/owners/2')
        .expect(200);
      // Ckeck that owner is deleted
      await expect(
        ownerRepository.findOneOrFail({ id: '1', carId: '2' })
      ).rejects.toThrow();
      return await expect(
        ownerRepository.findOneOrFail({ id: '1', carId: '1' })
      ).resolves.toBeDefined();
    });
    it('delete not found', async () => {
      await request(app.getHttpServer())
        .delete('/cars/1/owners/1')
        .expect(404);
    });
  });

  describe('/cars/jobs (POST)', () => {
    it('trigger: empty car db', async () => {
      let jobId: string;
      await request(app.getHttpServer())
        .post('/cars/jobs')
        .send()
        .expect(201)
        .expect(res => (jobId = res.body?.id));
      expect(jobId).toBeDefined();
      const job = await queueProcessor.queue.getJob(jobId);
      expect(job).toBeDefined();
      const result = await job.finished();
      expect(result).toBeDefined();
      const resultDto = <JobResultDto>result;
      expect(resultDto.discountedPrices).toEqual(0);
      expect(resultDto.removedOwners).toEqual(0);
    });
    it('trigger: no matching car', async () => {
      await manufacturerRepository.save([
        { id: '1', name: 'Test1' },
        { id: '2', name: 'Test2' }
      ]);
      await carRepository.save([
        {
          id: '1',
          manufacturerId: '1',
          price: 100,
          firstRegistrationDate: nowAddMonth(-11),
          owners: [
            { id: '1', name: 'Test1', purchaseDate: new Date() },
            { id: '2', name: 'Test2', purchaseDate: new Date() }
          ]
        },
        {
          id: '2',
          manufacturerId: '1',
          price: 200,
          firstRegistrationDate: new Date(),
          owners: [
            { id: '3', name: 'Test1', purchaseDate: new Date() },
            { id: '4', name: 'Test2', purchaseDate: new Date() }
          ]
        },
        {
          id: '3',
          manufacturerId: '2',
          price: 300,
          firstRegistrationDate: nowAddMonth(-19),
          owners: [
            { id: '5', name: 'Test1', purchaseDate: new Date() },
            { id: '6', name: 'Test2', purchaseDate: new Date() }
          ]
        }
      ]);
      let jobId: string;
      await request(app.getHttpServer())
        .post('/cars/jobs')
        .send()
        .expect(201)
        .expect(res => (jobId = res.body?.id));
      expect(jobId).toBeDefined();
      const job = await queueProcessor.queue.getJob(jobId);
      expect(job).toBeDefined();
      const result = await job.finished();
      expect(result).toBeDefined();
      const resultDto = <JobResultDto>result;
      expect(resultDto.discountedPrices).toEqual(0);
      expect(resultDto.removedOwners).toEqual(0);
    });
    it('trigger: matching cars', async () => {
      await manufacturerRepository.save([
        { id: '1', name: 'Test1' },
        { id: '2', name: 'Test2' }
      ]);
      await carRepository.save([
        {
          id: '1',
          manufacturerId: '1',
          price: 100,
          firstRegistrationDate: nowAddMonth(-11),
          owners: [
            { id: '1', name: 'Test1', purchaseDate: new Date() },
            { id: '2', name: 'Test2', purchaseDate: new Date() }
          ]
        },
        {
          id: '2',
          manufacturerId: '2',
          price: 200,
          firstRegistrationDate: nowAddMonth(-20),
          owners: [
            { id: '1', name: 'Test1', purchaseDate: nowAddMonth(-19) },
            { id: '2', name: 'Test2', purchaseDate: new Date() }
          ]
        },
        {
          id: '3',
          manufacturerId: '1',
          price: 300,
          firstRegistrationDate: nowAddMonth(-13),
          owners: [
            { id: '1', name: 'Test1', purchaseDate: new Date() },
            { id: '2', name: 'Test2', purchaseDate: new Date() }
          ]
        },
        {
          id: '4',
          manufacturerId: '2',
          price: 400,
          firstRegistrationDate: nowAddMonth(-17),
          owners: [
            { id: '1', name: 'Test1', purchaseDate: new Date() },
            { id: '2', name: 'Test2', purchaseDate: nowAddMonth(-19) }
          ]
        },
        {
          id: '5',
          manufacturerId: '1',
          price: 500,
          firstRegistrationDate: nowAddMonth(-19),
          owners: [
            { id: '1', name: 'Test1', purchaseDate: new Date() },
            { id: '2', name: 'Test2', purchaseDate: new Date() }
          ]
        },
        {
          id: '6',
          manufacturerId: '1',
          price: 500,
          firstRegistrationDate: nowAddMonth(-16),
          priceDiscounted: true,
          owners: [
            { id: '1', name: 'Test1', purchaseDate: new Date() },
            { id: '2', name: 'Test2', purchaseDate: new Date() }
          ]
        }
      ]);
      let jobId: string;
      await request(app.getHttpServer())
        .post('/cars/jobs')
        .send()
        .expect(201)
        .expect(res => (jobId = res.body?.id));
      expect(jobId).toBeDefined();
      const job = await queueProcessor.queue.getJob(jobId);
      expect(job).toBeDefined();
      const result = await job.finished();
      expect(result).toBeDefined();
      const resultDto = <JobResultDto>result;
      expect(resultDto.discountedPrices).toEqual(2);
      expect(resultDto.removedOwners).toEqual(2);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
