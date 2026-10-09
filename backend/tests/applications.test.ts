import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/db/connect.js';
import { Application } from '../src/models/Application.js';

let mongod: MongoMemoryServer;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let app: any;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await connectDB(mongod.getUri('applytrack-test'));
  app = createApp();
}, 60000);

afterAll(async () => {
  await disconnectDB();
  if (mongod) await mongod.stop();
});

beforeEach(async () => {
  await Application.deleteMany({});
});

describe('POST /api/applications', () => {
  it('creates an application with valid input', async () => {
    const res = await request(app)
      .post('/api/applications')
      .send({ company: 'Acme', role: 'Frontend Engineer', status: 'applied' });
    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.company).toBe('Acme');
    expect(res.body.data.role).toBe('Frontend Engineer');
  });

  it('rejects missing company with 400', async () => {
    const res = await request(app).post('/api/applications').send({ role: 'Dev' });
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it('rejects invalid status with 400', async () => {
    const res = await request(app)
      .post('/api/applications')
      .send({ company: 'Acme', role: 'Dev', status: 'hired-tomorrow' });
    expect(res.status).toBe(400);
  });

  it('rejects invalid jobUrl with 400', async () => {
    const res = await request(app)
      .post('/api/applications')
      .send({ company: 'Acme', role: 'Dev', jobUrl: 'not-a-url' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/applications', () => {
  it('lists, searches, and filters by status', async () => {
    await Application.create([
      { company: 'Acme', role: 'Frontend Engineer', status: 'applied' },
      { company: 'Globex', role: 'Backend Engineer', status: 'interview' },
    ]);
    const all = await request(app).get('/api/applications');
    expect(all.status).toBe(200);
    expect(all.body.pagination.total).toBe(2);

    const search = await request(app).get('/api/applications').query({ q: 'globex' });
    expect(search.body.pagination.total).toBe(1);
    expect(search.body.data[0].company).toBe('Globex');

    const filtered = await request(app).get('/api/applications').query({ status: 'interview' });
    expect(filtered.body.pagination.total).toBe(1);
  });
});

describe('GET /api/applications/stats', () => {
  it('returns real counts', async () => {
    await Application.create([
      { company: 'A', role: 'R1', status: 'applied' },
      { company: 'B', role: 'R2', status: 'interview' },
      { company: 'C', role: 'R3', status: 'offer' },
    ]);
    const res = await request(app).get('/api/applications/stats');
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(3);
    expect(res.body.data.byStatus.applied).toBe(1);
  });
});

describe('GET/PATCH/DELETE /api/applications/:id', () => {
  it('reads, updates, and deletes', async () => {
    const created = await request(app)
      .post('/api/applications')
      .send({ company: 'Acme', role: 'Dev' });
    const id = created.body.data._id as string;

    const got = await request(app).get(`/api/applications/${id}`);
    expect(got.status).toBe(200);

    const patched = await request(app).patch(`/api/applications/${id}`).send({ status: 'interview' });
    expect(patched.status).toBe(200);
    expect(patched.body.data.status).toBe('interview');

    const deleted = await request(app).delete(`/api/applications/${id}`);
    expect(deleted.status).toBe(200);

    const missing = await request(app).get(`/api/applications/${id}`);
    expect(missing.status).toBe(404);
  });

  it('rejects malformed ids with 400', async () => {
    const res = await request(app).get('/api/applications/not-an-id');
    expect(res.status).toBe(400);
  });
});
