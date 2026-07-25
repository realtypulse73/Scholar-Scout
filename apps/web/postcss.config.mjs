/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {
      config: new URL('./tailwind.config.js', import.meta.url).pathname,
    },
  },
};

export default config;
