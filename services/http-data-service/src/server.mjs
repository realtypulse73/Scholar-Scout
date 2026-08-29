import { createServer as createHttpServer } from 'node:http';
import { createHash, randomUUID } from 'node:crypto';
import { copyFile, mkdir, open, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultDataFile = path.resolve(
  dirname,
  '..',
  '..',
  '..',
  'data',
  'scholarscout-service-data.json',
);

const initialData = {
  users: [],
  onboardingProfiles: {},
  shortlists: {},
  programmeRecords: [],
  auditEvents: [],
};

export function createScholarScoutDataService({
  dataFile = defaultDataFile,
  token = process.env.SCHOLARSCOUT_DATA_SERVICE_TOKEN,
  writeLifecycle,
} = {}) {
  let writeQueue = Promise.resolve();
  return createHttpServer(async (request, response) => {
    try {
      if (token && request.headers.authorization !== `Bearer ${token}`) {
        sendJson(response, 401, { error: 'Unauthorized' });
        return;
      }

      if (request.url === '/health') {
        sendJson(response, 200, { ok: true, service: 'scholarscout-data' });
        return;
      }

      if (request.url !== '/scholarscout') {
        sendJson(response, 404, { error: 'Not found' });
        return;
      }

      if (request.method === 'GET') {
        await handleRead(response, dataFile);
        return;
      }

      if (request.method === 'PUT') {
        const write = writeQueue.then(() => handleWrite(
          request,
          response,
          dataFile,
          writeLifecycle,
        ));
        writeQueue = write.catch(() => undefined);
        await write;
        return;
      }

      response.setHeader('Allow', 'GET, PUT');
      sendJson(response, 405, { error: 'Method not allowed' });
    } catch (error) {
      if (error instanceof SyntaxError) {
        sendJson(response, 400, { error: 'Invalid JSON document' });
        return;
      }

      sendJson(response, 500, { error: 'Data service error' });
    }
  });
}

async function handleRead(response, dataFile) {
  let file;

  try {
    file = await readFile(dataFile, 'utf8');
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'ENOENT') {
      sendJson(response, 404, { error: 'No ScholarScout data document yet' });
      return;
    }

    sendJson(response, 500, { error: 'Data service error' });
    return;
  }

  try {
    sendJson(response, 200, normalizeData(JSON.parse(file)), {
      ETag: createStrongEtag(file),
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      sendJson(response, 500, { error: 'Invalid stored data document' });
      return;
    }

    sendJson(response, 500, { error: 'Data service error' });
  }
}

async function handleWrite(request, response, dataFile, writeLifecycle) {
  const rawBody = await readRequestBody(request);
  const data = normalizeData(JSON.parse(rawBody));

  await mkdir(path.dirname(dataFile), { recursive: true });
  const lockPath = `${dataFile}.lock`;
  const lock = await acquireWriteLock(lockPath, writeLifecycle);
  try {
    await writeLifecycle?.({ stage: 'lock-acquired', dataFile });
    let current = null;
    try {
      current = await readFile(dataFile, 'utf8');
    } catch (error) {
      if (!error || typeof error !== 'object' || error.code !== 'ENOENT') throw error;
    }
    const ifMatch = request.headers['if-match'];
    const ifNoneMatch = request.headers['if-none-match'];
    const preconditionMatches = current === null
      ? ifNoneMatch === '*'
      : typeof ifMatch === 'string' && ifMatch === createStrongEtag(current);
    if (!preconditionMatches) {
      sendJson(response, 412, { error: 'Data document changed' });
      return;
    }
    await backupExistingDocument(dataFile);
    const serialized = JSON.stringify(data, null, 2);
    const temporaryPath = `${dataFile}.${process.pid}.${randomUUID()}.tmp`;
    await writeFile(temporaryPath, serialized);
    await rename(temporaryPath, dataFile);
    sendJson(response, 200, { ok: true }, { ETag: createStrongEtag(serialized) });
  } finally {
    await lock.close();
    await unlink(lockPath).catch(() => undefined);
  }
}

async function acquireWriteLock(lockPath, writeLifecycle) {
  const attempts = 100;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await open(lockPath, 'wx');
    } catch (error) {
      if (!error || typeof error !== 'object' || error.code !== 'EEXIST') throw error;
      await writeLifecycle?.({ stage: 'lock-contended', lockPath, attempt });
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }

  throw new Error('Timed out waiting for the ScholarScout data write lock');
}

async function backupExistingDocument(dataFile) {
  try {
    await readFile(dataFile, 'utf8');
  } catch {
    return;
  }

  const backupDirectory = path.join(path.dirname(dataFile), 'backups');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  await mkdir(backupDirectory, { recursive: true });
  await copyFile(dataFile, path.join(backupDirectory, `${timestamp}.json`));
}

function normalizeData(data) {
  return {
    ...initialData,
    ...data,
    users: Array.isArray(data.users) ? data.users : [],
    programmeRecords: Array.isArray(data.programmeRecords)
      ? data.programmeRecords
      : [],
    auditEvents: Array.isArray(data.auditEvents) ? data.auditEvents : [],
    onboardingProfiles:
      data.onboardingProfiles && typeof data.onboardingProfiles === 'object'
        ? data.onboardingProfiles
        : {},
    shortlists:
      data.shortlists && typeof data.shortlists === 'object'
        ? data.shortlists
        : {},
  };
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';

    request.setEncoding('utf8');
    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => resolve(body || '{}'));
    request.on('error', reject);
  });
}

function sendJson(response, status, body, headers = {}) {
  response.writeHead(status, { 'Content-Type': 'application/json', ...headers });
  response.end(JSON.stringify(body));
}

function createStrongEtag(value) {
  return `"${createHash('sha256').update(value).digest('hex')}"`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT ?? 4010);
  const server = createScholarScoutDataService({
    dataFile: process.env.SCHOLARSCOUT_DATA_SERVICE_FILE ?? defaultDataFile,
  });

  server.listen(port, () => {
    console.log(`ScholarScout data service listening on http://localhost:${port}/scholarscout`);
  });
}
