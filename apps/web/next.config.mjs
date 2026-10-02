/** @type {import('next').NextConfig} */
// Keep MediaInfo's Node-aware CommonJS entry outside webpack. Its browser "module" entry
// resolves the WASM asset as a bare import, which is not valid for server-side inspection.
const nextConfig = {
  serverExternalPackages: ['mediainfo.js'],
};

export default nextConfig;
