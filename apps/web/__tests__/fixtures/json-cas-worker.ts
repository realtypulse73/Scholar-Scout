import { createHash, randomUUID } from 'node:crypto';
import { access, open, readFile, rename, unlink, writeFile } from 'node:fs/promises';

async function main() {
  const [filePath, barrierPath, workerId] = process.argv.slice(2);
  const source = await readFile(filePath, 'utf8').catch(() => null);
  const expectedVersion = source === null ? null : hash(source);
  const data = source === null
    ? { users: [], onboardingProfiles: {}, shortlists: {}, programmeRecords: [], auditEvents: [] }
    : JSON.parse(source);
  data.programmeRecords = [{ id: workerId }];
  await writeFile(`${barrierPath}.${workerId}.ready`, 'ready');
  while (true) {
    try { await access(barrierPath); break; } catch { await delay(5); }
  }
  const lockPath = `${filePath}.lock`;
  let lock;
  const deadline = Date.now() + 1_000;
  while (!lock) {
    try { lock = await open(lockPath, 'wx'); } catch (error) {
      if (!(error instanceof Error) || !('code' in error) || error.code !== 'EEXIST') throw error;
      if (Date.now() >= deadline) throw new Error('lock unavailable');
      await delay(10);
    }
  }
  const temporaryPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
  try {
    const current = await readFile(filePath, 'utf8').catch(() => null);
    if ((current === null ? null : hash(current)) !== expectedVersion) {
      process.stdout.write(JSON.stringify({ status: 'conflict' }));
      return;
    }
    const serialized = JSON.stringify(data, null, 2);
    await writeFile(temporaryPath, serialized);
    await rename(temporaryPath, filePath);
    process.stdout.write(JSON.stringify({ status: 'applied', version: hash(serialized) }));
  } finally {
    await unlink(temporaryPath).catch(() => undefined);
    await lock.close();
    await unlink(lockPath).catch(() => undefined);
  }
}

function hash(value: string) {
  return `"${createHash('sha256').update(value).digest('hex')}"`;
}

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

void main().catch((error) => {
  process.stderr.write(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
