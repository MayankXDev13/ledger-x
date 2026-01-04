const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts = [...config.resolver.sourceExts, "mjs"];

config.resolver.unstable_enableSymlinks = true;

config.resolver.unstable_packageMainFields = ["browser", "main"];

config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  stream: path.resolve(__dirname, "node_modules/stream-browserify"),
  events: path.resolve(__dirname, "node_modules/events"),
  https: path.resolve(__dirname, "node_modules/https-browserify"),
  http: path.resolve(__dirname, "node_modules/http-browserify"),
  net: path.resolve(__dirname, "node_modules/net-browserify"),
  tls: path.resolve(__dirname, "node_modules/tls-browserify"),
  buffer: path.resolve(__dirname, "node_modules/buffer"),
  crypto: path.resolve(__dirname, "node_modules/crypto-browserify"),
  url: path.resolve(__dirname, "node_modules/url-polyfill"),
};

config.transformer.unstable_allowRequireContext = true;

module.exports = config;
