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

  it('returns a practical error for invalid JSON writes', async () => {
    const response = await fetch(baseUrl, {
      method: 'PUT',
      headers: { Authorization: 'Bearer test-token' },
      body: '{bad json',
    });

    assert.equal(response.status, 400);
    assert.equal((await response.json()).error, 'Invalid JSON document');
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

    const response = await fetch(baseUrl, {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedDocument),
    });
    const backups = await readdir(path.join(tempDir, 'backups'));

    assert.equal(response.status, 200);
    assert.equal(backups.length, 1);
  });
});
