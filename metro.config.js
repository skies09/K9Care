const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Required for expo-sqlite on web (wa-sqlite WASM)
config.resolver.assetExts.push('wasm');

// SharedArrayBuffer needs COOP/COEP headers for SQLite on web
const previousEnhanceMiddleware = config.server.enhanceMiddleware;
config.server.enhanceMiddleware = (middleware, server) => {
	const base = previousEnhanceMiddleware
		? previousEnhanceMiddleware(middleware, server)
		: middleware;
	return (req, res, next) => {
		res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
		res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
		return base(req, res, next);
	};
};

module.exports = config;
