import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.resolve(dirname, '..', 'src', 'server.mjs');

const source = await readFile(serverPath, 'utf8');

if (!source.includes('createScholarScoutDataService')) {
  throw new Error('HTTP data service export is missing.');
}

if (!source.includes('/scholarscout')) {
  throw new Error('HTTP data service route is missing.');
}
