import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

describe('AppController (e2e)', () => {
  let app: INestApplication<App> | undefined;

  beforeEach(async () => {
    process.env.JWT_SECRET ??= 'test-only-jwt-secret-for-e2e'

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/health (GET)', async () => {
    await request(app!.getHttpServer())
    .get('/health')
    .expect(200)
    .expect({
      status: 'ok',
      service: 'convetaruba-api'
    });
  });

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });
});