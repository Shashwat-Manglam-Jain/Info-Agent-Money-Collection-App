const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Required for expo-sqlite web worker to resolve `wa-sqlite.wasm`.
if (!config.resolver.assetExts.includes('wasm')) {
  config.resolver.assetExts.push('wasm');
}

// Required by sqlite web worker runtime (`SharedArrayBuffer`).
const originalEnhanceMiddleware = config.server?.enhanceMiddleware;
config.server = config.server ?? {};
config.server.enhanceMiddleware = (middleware, server) => {
  const nextMiddleware = originalEnhanceMiddleware ? originalEnhanceMiddleware(middleware, server) : middleware;

  return (req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    return nextMiddleware(req, res, next);
  };
};

module.exports = config;
