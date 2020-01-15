import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { Connection, Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { Manufacturer } from '../src/manufacturer/manufacturer.entity';
import { Car } from '../src/car/car.entity';
import { Owner } from '../src/car/owner.entity';

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
  });

  describe('/cars (GET)', () => {
    it('empty', () => {
      return request(app.getHttpServer())
        .get('/cars')
        .expect(200)
        .expect([]);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
