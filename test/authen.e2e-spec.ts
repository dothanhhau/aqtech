import { AppModule } from '@/app.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

let app: INestApplication;
let httpClient: request.SuperTest<request.Test>;

describe('Authentication Testing (e2e)', () => {
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    httpClient = request(app.getHttpServer());
  });

  let jwtToken: string;
  const jwtRegex = /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/;
  const username = '0326395169';
  const password = '123456';

  describe('authenticates user', () => {
    test('authenticates user with valid credentials and provides a jwt token', async () => {
      const response = await httpClient.post('/auth/login').send({ username, password }).expect(201);

      // set jwt token for use in subsequent tests
      jwtToken = response.body.access_token;
      expect(jwtToken).toMatch(jwtRegex); // jwt regex
    });

    test('fails to authenticate user with an incorrect password', async () => {
      const response = await httpClient.post('/auth/login').send({ username, password: 'wrong' }).expect(400);

      expect(response.body.access_token).not.toBeDefined();
    });

    // assume test data does not include a nobody@example.com user
    test('fails to authenticate user that does not exist', async () => {
      const response = await httpClient
        .post('/auth/login')
        .send({ username: 'nobody@example.com', password: 'test' })
        .expect(400);

      expect(response.body.access_token).not.toBeDefined();
    });
  });

  describe('authenticates route', () => {
    test('gets protected resource with jwt authenticated request', async () => {
      const response = await httpClient.get('/users/me').set('Authorization', `Bearer ${jwtToken}`).expect(200);

      const data = response.body;
      expect(data.username).toEqual(username);
    });
  });
});
