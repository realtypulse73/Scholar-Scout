import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createScholarScoutDataService } from '../src/server.mjs';

describe('ScholarScout HTTP data service fixture', () => {
  let tempDir;
  let dataFile;
  let server;
  let baseUrl;

  before(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'scholarscout-data-'));
    dataFile = path.join(tempDir, 'data.json');
    server = createScholarScoutDataService({ dataFile, token: 'test-token' });
    await new Promise((resolve) => server.listen(0, resolve));
    const address = server.address();
    baseUrl = `http://127.0.0.1:${address.port}/scholarscout`;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await rm(tempDir, { recursive: true, force: true });
  });

  it('requires the configured bearer token', async () => {
    const response = await fetch(baseUrl);

    assert.equal(response.status, 401);
  });

  it('returns 404 until a document exists', async () => {
    const response = await fetch(baseUrl, {
      headers: { Authorization: 'Bearer test-token' },
    });

    assert.equal(response.status, 404);
  });

  it('allows only one first creator for an absent document', async () => {
    const create = (id) => fetch(baseUrl, {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer test-token',
        'Content-Type': 'application/json',
        'If-None-Match': '*',
      },
      body: JSON.stringify({
        users: [], onboardingProfiles: {}, shortlists: {},
        programmeRecords: [{ id }], auditEvents: [],
      }),
    });
    const [first, second] = await Promise.all([create('first'), create('second')]);
    assert.deepEqual([first.status, second.status].sort(), [200, 412]);
    await rm(dataFile);
  });

  it('fails closed when the stored document is malformed', async () => {
    await writeFile(dataFile, '{malformed stored json');

    const response = await fetch(baseUrl, {
      headers: { Authorization: 'Bearer test-token' },
    });

    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { error: 'Invalid stored data document' });
    await rm(dataFile);
  });

  it('distinguishes provider read failure from a missing document', async () => {
    const unreadablePath = path.join(tempDir, 'provider-directory');
    await mkdir(unreadablePath);
    const failureServer = createScholarScoutDataService({
      dataFile: unreadablePath,
      token: 'test-token',
    });
    await new Promise((resolve) => failureServer.listen(0, resolve));
    const address = failureServer.address();

    try {
      const response = await fetch(
        `http://127.0.0.1:${address.port}/scholarscout`,
        { headers: { Authorization: 'Bearer test-token' } },
      );

      assert.equal(response.status, 500);
      assert.deepEqual(await response.json(), { error: 'Data service error' });
    } finally {
      await new Promise((resolve) => failureServer.close(resolve));
    }
  });

  it('exposes a health check outside the data document route', async () => {
    const response = await fetch(baseUrl.replace('/scholarscout', '/health'), {
      headers: { Authorization: 'Bearer test-token' },
    });

    assert.equal(response.status, 200);
    assert.equal((await response.json()).service, 'scholarscout-data');
  });

  it('returns a practical error for invalid JSON writes without changing the winning document', async () => {
    const winningDocument = {
      users: [], onboardingProfiles: {}, shortlists: {},
      programmeRecords: [{ id: 'write-failure-winner' }], auditEvents: [],
    };
    await writeFile(dataFile, JSON.stringify(winningDocument));

    const response = await fetch(baseUrl, {
      method: 'PUT',
      headers: { Authorization: 'Bearer test-token' },
      body: '{bad json',
    });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: 'Invalid JSON document' });
    assert.deepEqual(JSON.parse(await readFile(dataFile, 'utf8')), winningDocument);
    await rm(dataFile);
  });

  it('stores and returns the ScholarScout data document', async () => {
    const document = {
      users: [],
      onboardingProfiles: {},
      shortlists: {},
      programmeRecords: [{ id: 'service-programme' }],
      auditEvents: [],
    };

    const writeResponse = await fetch(baseUrl, {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer test-token',
        'Content-Type': 'application/json',
        'If-None-Match': '*',
      },
      body: JSON.stringify(document),
    });
    const readResponse = await fetch(baseUrl, {
      headers: { Authorization: 'Bearer test-token' },
    });
    const storedFile = JSON.parse(await readFile(dataFile, 'utf8'));

    assert.equal(writeResponse.status, 200);
    assert.equal(readResponse.status, 200);
    assert.equal((await readResponse.json()).programmeRecords[0].id, 'service-programme');
    assert.equal(storedFile.programmeRecords[0].id, 'service-programme');
  });

  it('backs up the previous document before replacing it', async () => {
    const updatedDocument = {
      users: [],
      onboardingProfiles: {},
      shortlists: {},
      programmeRecords: [{ id: 'replacement-programme' }],
      auditEvents: [],
    };

    const currentResponse = await fetch(baseUrl, {
      headers: { Authorization: 'Bearer test-token' },
    });
    const response = await fetch(baseUrl, {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer test-token',
        'Content-Type': 'application/json',
        'If-Match': currentResponse.headers.get('etag'),
      },
      body: JSON.stringify(updatedDocument),
    });
    const backups = await readdir(path.join(tempDir, 'backups'));

    assert.equal(response.status, 200);
    assert.equal(backups.length, 1);
  });

  it('rejects stale replacements and preserves the winning document', async () => {
    const current = await fetch(baseUrl, {
      headers: { Authorization: 'Bearer test-token' },
    });
    const etag = current.headers.get('etag');
    const makeRequest = (id) => fetch(baseUrl, {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer test-token',
        'Content-Type': 'application/json',
        'If-Match': etag,
      },
      body: JSON.stringify({
        users: [], onboardingProfiles: {}, shortlists: {},
        programmeRecords: [{ id }], auditEvents: [],
      }),
    });
    const [first, second] = await Promise.all([
      makeRequest('winner-one'),
      makeRequest('winner-two'),
    ]);
    assert.deepEqual([first.status, second.status].sort(), [200, 412]);
    const stored = JSON.parse(await readFile(dataFile, 'utf8'));
    assert.ok(['winner-one', 'winner-two'].includes(stored.programmeRecords[0].id));
  });

  it('serializes the conditional critical section across service instances', { timeout: 3000 }, async () => {
    const current = await fetch(baseUrl, {
      headers: { Authorization: 'Bearer test-token' },
    });
    const etag = current.headers.get('etag');
    let releaseFirstLock;
    const firstLockReleased = new Promise((resolve) => {
      releaseFirstLock = resolve;
    });
    let firstLockAcquired;
    const firstAcquired = new Promise((resolve) => {
      firstLockAcquired = resolve;
    });
    let secondContended;
    const contentionObserved = new Promise((resolve) => {
      secondContended = resolve;
    });
    let acquiredCriticalSections = 0;
    const firstServer = createScholarScoutDataService({
      dataFile,
      token: 'test-token',
      writeLifecycle: async ({ stage }) => {
        if (stage !== 'lock-acquired') return;
        acquiredCriticalSections += 1;
        firstLockAcquired();
        await firstLockReleased;
      },
    });
    const secondServer = createScholarScoutDataService({
      dataFile,
      token: 'test-token',
      writeLifecycle: async ({ stage }) => {
        if (stage === 'lock-acquired') acquiredCriticalSections += 1;
        if (stage === 'lock-contended') secondContended();
      },
    });
    await Promise.all([
      new Promise((resolve) => firstServer.listen(0, resolve)),
      new Promise((resolve) => secondServer.listen(0, resolve)),
    ]);
    const firstAddress = firstServer.address();
    const secondAddress = secondServer.address();
    const replace = (port, id) => fetch(`http://127.0.0.1:${port}/scholarscout`, {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer test-token',
        'Content-Type': 'application/json',
        'If-Match': etag,
      },
      body: JSON.stringify({
        users: [], onboardingProfiles: {}, shortlists: {},
        programmeRecords: [{ id }], auditEvents: [],
      }),
    });

    try {
      const firstRequest = replace(firstAddress.port, 'shared-file-winner');
      await firstAcquired;
      const secondRequest = replace(secondAddress.port, 'shared-file-loser');
      await contentionObserved;
      assert.equal(acquiredCriticalSections, 1);
      releaseFirstLock();
      const [firstResponse, secondResponse] = await Promise.all([
        firstRequest,
        secondRequest,
      ]);
      assert.equal(firstResponse.status, 200);
      assert.equal(secondResponse.status, 412);
      const stored = JSON.parse(await readFile(dataFile, 'utf8'));
      assert.equal(stored.programmeRecords[0].id, 'shared-file-winner');
    } finally {
      releaseFirstLock();
      await Promise.all([
        new Promise((resolve) => firstServer.close(resolve)),
        new Promise((resolve) => secondServer.close(resolve)),
      ]);
    }
  });

  it('serializes competing first creation across service instances', { timeout: 3000 }, async () => {
    const createFile = path.join(tempDir, 'create-race.json');
    let releaseFirstLock;
    const firstLockReleased = new Promise((resolve) => {
      releaseFirstLock = resolve;
    });
    let firstLockAcquired;
    const firstAcquired = new Promise((resolve) => {
      firstLockAcquired = resolve;
    });
    let secondContended;
    const contentionObserved = new Promise((resolve) => {
      secondContended = resolve;
    });
    let acquiredCriticalSections = 0;
    const firstServer = createScholarScoutDataService({
      dataFile: createFile,
      token: 'test-token',
      writeLifecycle: async ({ stage }) => {
        if (stage !== 'lock-acquired') return;
        acquiredCriticalSections += 1;
        firstLockAcquired();
        await firstLockReleased;
      },
    });
    const secondServer = createScholarScoutDataService({
      dataFile: createFile,
      token: 'test-token',
      writeLifecycle: async ({ stage }) => {
        if (stage === 'lock-acquired') acquiredCriticalSections += 1;
        if (stage === 'lock-contended') secondContended();
      },
    });
    await Promise.all([
      new Promise((resolve) => firstServer.listen(0, resolve)),
      new Promise((resolve) => secondServer.listen(0, resolve)),
    ]);
    const firstAddress = firstServer.address();
    const secondAddress = secondServer.address();
    const create = (port, id) => fetch(`http://127.0.0.1:${port}/scholarscout`, {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer test-token',
        'Content-Type': 'application/json',
        'If-None-Match': '*',
      },
      body: JSON.stringify({
        users: [], onboardingProfiles: {}, shortlists: {},
        programmeRecords: [{ id }], auditEvents: [],
      }),
    });

    try {
      const firstRequest = create(firstAddress.port, 'first-creator');
      await firstAcquired;
      const secondRequest = create(secondAddress.port, 'second-creator');
      await contentionObserved;
      assert.equal(acquiredCriticalSections, 1);
      releaseFirstLock();
      const [firstResponse, secondResponse] = await Promise.all([
        firstRequest,
        secondRequest,
      ]);
      assert.equal(firstResponse.status, 200);
      assert.equal(secondResponse.status, 412);
      const stored = JSON.parse(await readFile(createFile, 'utf8'));
      assert.equal(stored.programmeRecords[0].id, 'first-creator');
    } finally {
      releaseFirstLock();
      await Promise.all([
        new Promise((resolve) => firstServer.close(resolve)),
        new Promise((resolve) => secondServer.close(resolve)),
      ]);
    }
  });
});
