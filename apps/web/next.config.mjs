import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** @type {import('next').NextConfig} */
// Keep MediaInfo's Node-aware CommonJS entry outside webpack. Its browser "module" entry
// resolves the WASM asset as a bare import, which is not valid for server-side inspection.
const workspaceRoot = path.join(fileURLToPath(new URL('.', import.meta.url)), '../..');

const nextConfig = {
  serverExternalPackages: ['mediainfo.js'],
  outputFileTracingRoot: workspaceRoot,
  // MediaInfo's Node entry opens this Wasm file dynamically. Trace the physical
  // pnpm package file instead of the workspace junction so Vercel can package it.
  outputFileTracingIncludes: {
    '/api/contributor-media/complete': [
      '../../node_modules/.pnpm/mediainfo.js@0.3.8/node_modules/mediainfo.js/dist/**/*',
    ],
  },
};

export default nextConfig;
