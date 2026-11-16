import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AuthModule } from '../src/auth/auth.module';
import { CvModule } from '../src/cv/cv.module';
import { Cv } from '../src/cv/entities/cv.entity';
import { Skill } from '../src/skill/entities/skill.entity';
import { User } from '../src/user/entities/user.entity';
import { Role } from '../src/user/enums/role.enum';

describe('Access control (slides 12 to 14)', () => {
  let app: INestApplication;

  before(async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, load: [() => ({ JWT_SECRET: 'test-only' })] }),
        TypeOrmModule.forRoot({ type: 'better-sqlite3', database: ':memory:', entities: [User, Skill, Cv], synchronize: true }),
        AuthModule, CvModule,
      ],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
    await app.listen(0, '127.0.0.1');
  });

  after(async () => { await app?.close(); });

  async function account(username: string, role: Role) {
    const api = request(app.getHttpServer());
    const credentials = { username, password: 'test-password' };
    const { body } = await api.post('/auth/register').send({ ...credentials, email: username + '@example.org' }).expect(201);
    await app.get(DataSource).getRepository(User).update(body.id, { role });
    const login = await api.post('/auth/login').send(credentials).expect(200);
    return { id: body.id, auth: 'Bearer ' + login.body['access-token'] };
  }

  it('allows only an authenticated admin to create a skill', async () => {
    const api = request(app.getHttpServer());
    const user = await account('skill-user', Role.USER);
    const admin = await account('skill-admin', Role.ADMIN);
    const skill = { designation: 'TypeScript' };
    await api.post('/skill').send(skill).expect(401);
    await api.post('/skill').set('Authorization', user.auth).send(skill).expect(403);
    const created = await api.post('/skill').set('Authorization', admin.auth).send(skill).expect(201);
    assert.equal(created.body.designation, skill.designation);
  });

  it('requires a login on all five CV routes', async () => {
    const api = request(app.getHttpServer());
    for (const call of [api.get('/cv'), api.get('/cv/1'), api.post('/cv'), api.patch('/cv/1'), api.delete('/cv/1')]) {
      await call.expect(401);
    }
  });

  it('uses the authenticated owner for creation, reads and writes', async () => {
    const api = request(app.getHttpServer());
    const owner = await account('owner', Role.USER);
    const other = await account('other', Role.ADMIN);
    const cv = await api.post('/cv').set('Authorization', owner.auth)
      .send({ name: 'Test', firstname: 'Alice', age: 25, cin: '12345678', job: 'Dev', userId: other.id }).expect(201);
    assert.equal(cv.body.user.id, owner.id);
    const adminCv = await api.post('/cv').set('Authorization', other.auth)
      .send({ name: 'Test', firstname: 'Bob', age: 30, cin: '87654321', job: 'Admin' }).expect(201);
    const url = '/cv/' + cv.body.id;
    assert.deepEqual((await api.get('/cv').set('Authorization', owner.auth).expect(200)).body.map((cv: Cv) => cv.id), [cv.body.id]);
    const adminList = await api.get('/cv').set('Authorization', other.auth).expect(200);
    assert.deepEqual(new Set(adminList.body.map((item: Cv) => item.id)), new Set([cv.body.id, adminCv.body.id]));
    await api.get(url).set('Authorization', other.auth).expect(403);
    await api.patch(url).set('Authorization', other.auth).send({ job: 'Designer' }).expect(403);
    await api.delete(url).set('Authorization', other.auth).expect(403);
    await api.patch(url).set('Authorization', owner.auth).send({ userId: other.id }).expect(400);
    await api.patch(url).set('Authorization', owner.auth).send({ job: 'Architecte' }).expect(200);
    assert.equal((await api.get(url).set('Authorization', owner.auth).expect(200)).body.job, 'Architecte');
    await api.delete(url).set('Authorization', owner.auth).expect(200);
    await api.get(url).set('Authorization', owner.auth).expect(404);
  });
});
