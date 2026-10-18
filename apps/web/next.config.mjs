/** @type {import('next').NextConfig} */
// Keep MediaInfo's Node-aware CommonJS entry outside webpack. Its browser "module" entry
// resolves the WASM asset as a bare import, which is not valid for server-side inspection.
const nextConfig = {
  serverExternalPackages: ['mediainfo.js'],
  // MediaInfo's Node entry loads this Wasm file at runtime, so static tracing
  // cannot infer it from the CommonJS loader.
  outputFileTracingIncludes: {
    '/api/contributor-media/complete': [
      './node_modules/mediainfo.js/dist/MediaInfoModule.wasm',
    ],
  },
};

export default nextConfig;
