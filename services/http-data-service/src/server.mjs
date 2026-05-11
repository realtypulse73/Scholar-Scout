import { createServer as createHttpServer } from 'node:http';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
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
} = {}) {
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
        await handleWrite(request, response, dataFile);
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
  try {
    const file = await readFile(dataFile, 'utf8');
    sendJson(response, 200, normalizeData(JSON.parse(file)));
  } catch {
    sendJson(response, 404, { error: 'No ScholarScout data document yet' });
  }
}

async function handleWrite(request, response, dataFile) {
  const rawBody = await readRequestBody(request);
  const data = normalizeData(JSON.parse(rawBody));

  await mkdir(path.dirname(dataFile), { recursive: true });
  await backupExistingDocument(dataFile);
  await writeFile(dataFile, JSON.stringify(data, null, 2));
  sendJson(response, 200, { ok: true });
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

function sendJson(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(body));
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
