const path = require("path");

const themesLoaderPath = path.resolve(__dirname, "scripts/themes-loader.js");
// This is the file our loader will target.
const themesFilePath = path.resolve(__dirname, "src/lib/themes.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone configuration for Turbopack (stable)
  turbopack: {
    rules: {
      // Turbopack uses globs to match files. We target our specific file.
      "**/src/lib/themes.ts": {
        loaders: [themesLoaderPath],
        as: "*.ts",
      },
    },
  },
  // Standalone configuration for Webpack
  webpack: (config) => {
    config.module.rules.push({
      // Webpack can test against the absolute path.
      test: themesFilePath,
      use: [
        {
          loader: themesLoaderPath,
        },
      ],
    });

    return config;
  },
};

export default nextConfig;
