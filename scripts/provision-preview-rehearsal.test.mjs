import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { provisionPreviewRehearsal } from './provision-preview-rehearsal.mjs';

test('creates distinct fixture-bound Blob paths in the local handoff only', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'scholarscout-preview-rehearsal-'));
  const localFile = path.join(directory, '.env.preview-rehearsal.local');
  const reportFile = path.join(directory, 'provisioning.md');

  await provisionPreviewRehearsal({ localFile, reportFile });

  const handoff = await readFile(localFile, 'utf8');
  const report = await readFile(reportFile, 'utf8');
  const values = Object.fromEntries(handoff
    .split('\n')
    .filter((line) => line.includes('='))
    .map((line) => line.split(/=(.*)/s, 2)));
  const baselinePath = values.BASELINE_SCHOLARSCOUT_BLOB_DATA_PATH;
  const outagePath = values.OUTAGE_SCHOLARSCOUT_BLOB_DATA_PATH;

  assert.match(baselinePath, new RegExp(`^scholarscout/preview/${values.BASELINE_SCHOLARSCOUT_E2E_FIXTURE_ID}/data\\.json$`));
  assert.match(outagePath, new RegExp(`^scholarscout/preview/${values.OUTAGE_SCHOLARSCOUT_E2E_FIXTURE_ID}/data\\.json$`));
  assert.notEqual(baselinePath, outagePath);
  for (const value of Object.values(values)) {
    assert.equal(report.includes(value), false);
  }
  assert.match(report, /two isolated storage paths are required/i);
});
