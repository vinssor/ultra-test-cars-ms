import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import * as request from 'supertest';

describe('Cars (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('/manufacturers (GET)', () => {
    it('empty', () => {
      return request(app.getHttpServer())
        .get('/cars')
        .expect(200)
        .expect([]);
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
