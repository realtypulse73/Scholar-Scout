import { readFileSync } from 'node:fs';

export function loadEnvFileFromArgs(args) {
  const envFile = getArgValue(args, '--env-file');

  if (!envFile) {
    return;
  }

  loadEnvFile(envFile);
}

export function loadEnvFile(filePath) {
  const contents = readFileSync(filePath, 'utf8');

  contents.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }

    const separatorIndex = trimmed.indexOf('=');

    if (separatorIndex === -1) {
      return;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = unquote(trimmed.slice(separatorIndex + 1).trim());

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
}

function getArgValue(args, name) {
  const index = args.indexOf(name);

  if (index === -1) {
    return '';
  }

  return args[index + 1] ?? '';
}

function unquote(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}
