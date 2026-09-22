// eslint-disable-next-line @typescript-eslint/no-require-imports -- CommonJS config file, required by next-pwa
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  // Sin esto, un service worker nuevo se instala pero no toma control de las
  // pestañas ya abiertas hasta que se cierran por completo — por eso se seguía
  // viendo la app anterior después de cada deploy.
  clientsClaim: true,
  cleanupOutdatedCaches: true,
  disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {};

module.exports = withPWA(nextConfig);
