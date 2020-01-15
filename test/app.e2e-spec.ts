import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { Connection, Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { Car } from '../src/car/car.entity';
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
    it('get empty list', () => {
      return request(app.getHttpServer())
        .get('/manufacturers')
        .expect(200)
        .expect([]);
    });
    it('get one', async () => {
      const manufacturer: Manufacturer = { id: '1', name: 'Test1' };
      await manufacturerRepository.insert(manufacturer);
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
      await manufacturerRepository.insert({ id: '1', name: 'Test1' });
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
      await manufacturerRepository.insert({ id: '1', name: 'Test1' });
      return request(app.getHttpServer())
        .put('/manufacturers/2')
        .send({ name: 'Test1' })
        .expect(409);
    });
    it('replace one', async () => {
      await manufacturerRepository.insert({ id: '1', name: 'Test1' });
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
      await manufacturerRepository.insert({ id: '1', name: 'Test1' });
      const car: Car = {
        id: '1',
        manufacturerId: '1',
        price: 100,
        firstRegistrationDate: new Date(0),
        owners: []
      };
      await carRepository.insert(clone(car));
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
      await manufacturerRepository.insert(manufacturer);
      await carRepository.insert({
        id: '1',
        manufacturerId: '1',
        price: 100,
        firstRegistrationDate: new Date(0),
        owners: []
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
          firstRegistrationDate: new Date(0),
          owners: []
        },
        {
          id: '2',
          manufacturerId: '1',
          price: 200,
          firstRegistrationDate: new Date(0),
          owners: []
        },
        {
          id: '3',
          manufacturerId: '2',
          price: 300,
          firstRegistrationDate: new Date(0),
          owners: []
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
      await manufacturerRepository.insert({ id: '1', name: 'Test1' });
      const car = {
        manufacturerId: '1',
        price: 100,
        firstRegistrationDate: new Date(0),
        owners: []
      };
      return request(app.getHttpServer())
        .post('/cars')
        .send(car)
        .expect(201)
        .expect(res => {
          res.body.id = 'id';
          res.body.firstRegistrationDate = new Date(
            res.body.firstRegistrationDate
          );
        })
        .expect({ ...{ id: 'id' }, ...car });
    });
    it('create one with unknown manufacturer', async () => {
      await manufacturerRepository.insert({ id: '1', name: 'Test1' });
      return request(app.getHttpServer())
        .post('/cars')
        .send({
          manufacturerId: '2',
          price: 100,
          firstRegistrationDate: new Date(0)
        })
        .expect(400);
    });
    it('create one with owners', async () => {
      await manufacturerRepository.insert({ id: '1', name: 'Test1' });
      const owners = [{ id: '1', name: 'Test1', purchaseDate: new Date(0) }];
      const car = {
        manufacturerId: '1',
        price: 100,
        firstRegistrationDate: new Date(0),
        owners: owners
      };
      return request(app.getHttpServer())
        .post('/cars')
        .send(car)
        .expect(201)
        .expect(res => {
          res.body.id = 'id';
          res.body.firstRegistrationDate = new Date(
            res.body.firstRegistrationDate
          );
          res.body.owners?.forEach((element: any) => {
            element.purchaseDate = new Date(element.purchaseDate);
          });
        })
        .expect({ ...{ id: 'id' }, ...car });
    });
    it('create many', async () => {
      await manufacturerRepository.insert({ id: '1', name: 'Test1' });
      const cars = [
        {
          id: '1',
          manufacturerId: '1',
          price: 100,
          firstRegistrationDate: new Date(0),
          owners: []
        },
        {
          id: '2',
          manufacturerId: '1',
          price: 200,
          firstRegistrationDate: new Date(0),
          owners: []
        },
        {
          id: '3',
          manufacturerId: '1',
          price: 300,
          firstRegistrationDate: new Date(0),
          owners: []
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
      await manufacturerRepository.insert({ id: '1', name: 'Test1' });
      return request(app.getHttpServer())
        .post('/cars/bulk')
        .send([
          {
            id: '1',
            manufacturerId: '1',
            price: 100,
            firstRegistrationDate: new Date(0),
            owners: [{ id: '1', name: 'Test1', purchaseDate: new Date(0) }]
          },
          {
            id: '2',
            manufacturerId: '1',
            price: 200,
            firstRegistrationDate: new Date(0),
            owners: [{ id: '2', name: 'Test2', purchaseDate: new Date(0) }]
          },
          {
            id: '3',
            manufacturerId: '2',
            price: 300,
            firstRegistrationDate: new Date(0),
            owners: [{ id: '1', name: 'Test1', purchaseDate: new Date(0) }]
          }
        ])
        .expect(400);
    });
    it('create many with owners', async () => {
      await manufacturerRepository.save([
        { id: '1', name: 'Test1' },
        { id: '2', name: 'Test2' }
      ]);
      const cars = [
        {
          id: '1',
          manufacturerId: '1',
          price: 100,
          firstRegistrationDate: new Date(0),
          owners: [{ id: '1', name: 'Test1', purchaseDate: new Date(0) }]
        },
        {
          id: '2',
          manufacturerId: '1',
          price: 200,
          firstRegistrationDate: new Date(0),
          owners: [{ id: '2', name: 'Test2', purchaseDate: new Date(0) }]
        },
        {
          id: '3',
          manufacturerId: '2',
          price: 300,
          firstRegistrationDate: new Date(0),
          owners: [{ id: '1', name: 'Test1', purchaseDate: new Date(0) }]
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
            element.owners?.forEach((owner: any) => {
              owner.purchaseDate = new Date(owner.purchaseDate);
            });
          });
        })
        .expect(cars);
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
        owners: []
      };
      return request(app.getHttpServer())
        .put('/cars/1')
        .send(car)
        .expect(200)
        .expect(
          res =>
            (res.body.firstRegistrationDate = new Date(
              res.body.firstRegistrationDate
            ))
        )
        .expect({ ...{ id: '1' }, ...car });
    });
    it('create one with unknown manufacturer', async () => {
      await manufacturerRepository.insert({ id: '1', name: 'Test1' });
      return request(app.getHttpServer())
        .put('/cars/1')
        .send({
          manufacturerId: '2',
          price: 100,
          firstRegistrationDate: new Date(0)
        })
        .expect(400);
    });
    it('create one with owners', async () => {
      await manufacturerRepository.insert({ id: '1', name: 'Test1' });
      const owners = [
        { id: '1', name: 'Test1', purchaseDate: new Date(0) },
        { id: '2', name: 'Test2', purchaseDate: new Date(0) }
      ];
      const car = {
        manufacturerId: '1',
        price: 100,
        firstRegistrationDate: new Date(0),
        owners: owners
      };
      return request(app.getHttpServer())
        .put('/cars/1')
        .send(car)
        .expect(200)
        .expect(res => {
          res.body.firstRegistrationDate = new Date(
            res.body.firstRegistrationDate
          );
          res.body.owners?.forEach((element: any) => {
            element.purchaseDate = new Date(element.purchaseDate);
          });
        })
        .expect({ ...{ id: '1' }, ...car });
    });
    it('replace one', async () => {
      await manufacturerRepository.insert({ id: '1', name: 'Test1' });
      const car = {
        manufacturerId: '1',
        price: 100,
        firstRegistrationDate: new Date(0),
        owners: []
      };
      await carRepository.insert({ ...{ id: '1' }, ...car });
      car.price = 200;
      return request(app.getHttpServer())
        .put('/cars/1')
        .send(car)
        .expect(200)
        .expect(
          res =>
            (res.body.firstRegistrationDate = new Date(
              res.body.firstRegistrationDate
            ))
        )
        .expect({ ...{ id: '1' }, ...car });
    });
    it('replace one with unknown manufacturer', async () => {
      await manufacturerRepository.insert({ id: '1', name: 'Test1' });
      const car = {
        manufacturerId: '1',
        price: 100,
        firstRegistrationDate: new Date(0),
        owners: []
      };
      await carRepository.insert({ ...{ id: '1' }, ...car });
      car.manufacturerId = '2';
      return request(app.getHttpServer())
        .put('/cars/1')
        .send(car)
        .expect(400);
    });
    it('replace one with owners', async () => {
      await manufacturerRepository.insert({ id: '1', name: 'Test1' });
      const owners = [
        { id: '1', name: 'Test1', purchaseDate: new Date(0) },
        { id: '2', name: 'Test2', purchaseDate: new Date(0) }
      ];
      const car = {
        manufacturerId: '1',
        price: 100,
        firstRegistrationDate: new Date(0),
        owners: owners
      };
      await carRepository.insert({ ...{ id: '1' }, ...car });
      car.price = 200;
      car.owners[1].name = 'Test2Up';
      car.owners.push({ id: '3', name: 'Test3', purchaseDate: new Date(0) });
      return request(app.getHttpServer())
        .put('/cars/1')
        .send(car)
        .expect(200)
        .expect(res => {
          res.body.firstRegistrationDate = new Date(
            res.body.firstRegistrationDate
          );
          res.body.owners?.forEach((element: any) => {
            element.purchaseDate = new Date(element.purchaseDate);
          });
        })
        .expect({ ...{ id: '1' }, ...car });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
