import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { Connection, Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { Car } from '../src/car/car.entity';
import { Owner } from '../src/car/owner.entity';
import { Manufacturer } from '../src/manufacturer/manufacturer.entity';

describe('Cars (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;
  let manufacturerRepository: Repository<Manufacturer>;
  let carRepository: Repository<Car>;
  let ownerRepository: Repository<Owner>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    connection = moduleFixture.get<Connection>(Connection);
    manufacturerRepository = connection.getRepository(Manufacturer);
    carRepository = connection.getRepository(Car);
    ownerRepository = connection.getRepository(Owner);
    await app.init();
  });

  beforeEach(async () => {
    // Clear DB before each test
    await connection.query('delete from owner');
    await connection.query('delete from car');
    await connection.query('delete from manufacturer');
  });

  describe('/manufacturers (GET)', () => {
    it('empty', () => {
      return request(app.getHttpServer())
        .get('/manufacturers')
        .expect(200)
        .expect([]);
    });
    it('one', async () => {
      const manufacturers: Manufacturer[] = [{ id: '1', name: 'Test1' }];
      await manufacturerRepository.save(manufacturers);
      return request(app.getHttpServer())
        .get('/manufacturers')
        .expect(200)
        .expect(manufacturers);
    });
    it('many', async () => {
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
    it('one', () => {
      return request(app.getHttpServer())
        .post('/manufacturers')
        .send({ name: 'Test1' })
        .expect(201)
        .expect(res => (res.body.id = 'id'))
        .expect({ id: 'id', name: 'Test1', phone: null, siret: null });
    });
    it('many', () => {
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
    it('one with conflict', async () => {
      await manufacturerRepository.insert({ id: '1', name: 'Test1' });
      return request(app.getHttpServer())
        .post('/manufacturers')
        .send({ name: 'Test1' })
        .expect(409);
    });
    it('many with conflict', async () => {
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
    it('create', () => {
      return request(app.getHttpServer())
        .put('/manufacturers/1')
        .send({ name: 'Test1' })
        .expect(200)
        .expect({ id: '1', name: 'Test1', phone: null, siret: null });
    });
    it('create with conflict', async () => {
      await manufacturerRepository.insert({ id: '1', name: 'Test1' });
      return request(app.getHttpServer())
        .put('/manufacturers/2')
        .send({ name: 'Test1' })
        .expect(409);
    });
    it('replace', async () => {
      await manufacturerRepository.insert({ id: '1', name: 'Test1' });
      return request(app.getHttpServer())
        .put('/manufacturers/1')
        .send({ name: 'Test2' })
        .expect(200)
        .expect({ id: '1', name: 'Test2', phone: null, siret: null });
    });
    it('replace with conflict', async () => {
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
    it('empty', () => {
      return request(app.getHttpServer())
        .get('/cars')
        .expect(200)
        .expect([]);
    });
    it('one', async () => {
      const manufacturers: Manufacturer[] = [{ id: '1', name: 'Test1' }];
      await manufacturerRepository.save(manufacturers);
      const cars: Car[] = [{ id: '1', manufacturerId: '1', price: 100, firstRegistrationDate: new Date(0), owners: [] }];
      await carRepository.save(cars);
      return request(app.getHttpServer())
        .get('/cars')
        .expect(200)
        .expect(res =>
          res?.body?.forEach((element: any) => {
            element.firstRegistrationDate = new Date(element.firstRegistrationDate);
            element.reduced = false;
          })
        )
        .expect(cars);
    });
    it('many', async () => {
      const manufacturers: Manufacturer[] = [
        { id: '1', name: 'Test1' },
        { id: '2', name: 'Test2' }
      ];
      await manufacturerRepository.save(manufacturers);
      const cars: Car[] = [
        { id: '1', manufacturerId: '1', price: 100, firstRegistrationDate: new Date(0), owners: [] },
        { id: '2', manufacturerId: '1', price: 200, firstRegistrationDate: new Date(0), owners: [] },
        { id: '3', manufacturerId: '2', price: 300, firstRegistrationDate: new Date(0), owners: [] }
      ];
      await carRepository.save(cars);
      return request(app.getHttpServer())
        .get('/cars')
        .expect(200)
        .expect(res =>
          res?.body?.forEach((element: any) => {
            element.firstRegistrationDate = new Date(element.firstRegistrationDate);
            element.reduced = false;
          })
        )
        .expect(cars);
    });
  });

  describe('/cars (POST)', () => {
    it('one', async () => {
      const manufacturers: Manufacturer[] = [{ id: '1', name: 'Test1' }];
      await manufacturerRepository.save(manufacturers);
      return request(app.getHttpServer())
        .post('/cars')
        .send({ manufacturerId: '1', price: 100, firstRegistrationDate: new Date(0), owners: [] })
        .expect(201)
        .expect(res => {
          res.body.id = 'id';
          res.body.firstRegistrationDate = new Date(res.body.firstRegistrationDate);
        })
        .expect({ id: 'id', manufacturerId: '1', price: 100, firstRegistrationDate: new Date(0), owners: [] });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
