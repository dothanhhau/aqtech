import { AppModule } from '@/app.module';
import { removeTimezone } from '@/shared/utility';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { isArray } from 'class-validator';
import { pick } from 'lodash';
import request from 'supertest';

let app: NestFastifyApplication;
let httpClient: request.SuperTest<request.Test>;

describe('Health Tracking (e2e)', () => {
  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    httpClient = request(app.getHttpServer());
  });

  const teacher = '0336396353';
  const parent = '0326395169';
  const password = '123456';

  let jwtTokenParent: string;
  let jwtTokenTeacher: string;
  let listStudent: Array<any>;
  let listTrack: Array<any>;

  const createPill = {
    student_id: '',
    description: 'test health tracking by e2e',
    tracking_date: '2022-11-30T01:47:32.001Z',
    height: 121,
    weight: 33,
  };

  describe('prepare to test health tracking', () => {
    test('authenticates parent', async () => {
      const response = await httpClient.post('/auth/login').send({ username: parent, password }).expect(201);
      jwtTokenParent = response.body.access_token;
    });

    test('authenticates teacher', async () => {
      const response = await httpClient.post('/auth/login').send({ username: teacher, password }).expect(201);
      jwtTokenTeacher = response.body.access_token;
    });

    test('get all student', async () => {
      const response = await httpClient
        .get('/student/all')
        .set('Authorization', `Bearer ${jwtTokenTeacher}`)
        .expect(200);

      listStudent = response.body.resources;
      createPill.student_id = listStudent[0].id;
    });
  });

  describe('health tracking flow', () => {
    test('add health tracking for a student with forbidden result', async () => {
      const response = await httpClient
        .post('/health-tracking')
        .set('Authorization', `Bearer ${jwtTokenParent}`)
        .send({
          student_id: listStudent[0].id,
          description: 'test health tracking by e2e',
          tracking_date: '2022-11-29T01:47:31.001Z',
          height: 121,
          weight: 33,
        })
        .expect(403);
    });

    test('add health tracking for a student with success result', async () => {
      const response = await httpClient
        .post('/health-tracking')
        .set('Authorization', `Bearer ${jwtTokenTeacher}`)
        .send(createPill)
        .expect(201);

      expect(response.body.student_id).toEqual(createPill.student_id);
      expect(response.body.tracking_date).toEqual(createPill.tracking_date);
      expect(response.body.description).toEqual(createPill.description);
      expect(response.body.weight).toEqual(createPill.weight);
      expect(response.body.height).toEqual(createPill.height);
    });

    test('get all health tracking', async () => {
      const response = await httpClient
        .get('/health-tracking')
        .set('Authorization', `Bearer ${jwtTokenTeacher}`)
        .query({
          student_id: listStudent[0].id,
          from_date: '2022/01/01',
          to_date: '2022/12/31',
        })
        .expect(200);

      listTrack = response.body.data;

      expect(isArray(listTrack)).toBeTruthy();
    });

    test('update health tracking for a student with success result', async () => {
      const upPill = pick(createPill, ['tracking_date', 'description', 'weight', 'height']);
      upPill.height += 1;
      upPill.weight += 1;
      upPill.tracking_date = '2022-11-30T01:47:31.001Z';

      const response = await httpClient
        .put('/health-tracking/' + listTrack[0].id)
        .set('Authorization', `Bearer ${jwtTokenTeacher}`)
        .send(upPill)
        .expect(200);

      expect(response.body.tracking_date).toEqual(upPill.tracking_date);
      expect(response.body.description).toEqual(upPill.description);
      expect(response.body.weight).toEqual(upPill.weight);
      expect(response.body.height).toEqual(upPill.height);
    });
  });
});
