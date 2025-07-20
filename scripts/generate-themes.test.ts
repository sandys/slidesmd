/* @vitest-environment node */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { generateThemes } from "./generate-themes.js";

let tmpDir: string;
let originalCwd: string;

describe("generateThemes", () => {
  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "themes-test-"));
    originalCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("copies reveal.js themes and creates list", async () => {
    await generateThemes();

    const revealPackageDir = path.dirname(require.resolve("reveal.js/package.json"));
    const themeDir = path.join(revealPackageDir, "dist", "theme");
    const expected = (await fs.readdir(themeDir))
      .filter((f) => f.endsWith(".css"))
      .filter((f) => !f.includes("white_contrast_compact_verbatim_headers"))
      .sort();

    const destDir = path.join(tmpDir, "public", "themes");
    const destFiles = (await fs.readdir(destDir)).sort();
    expect(destFiles).toEqual(expected);

    const themesFile = await fs.readFile(path.join(tmpDir, "src", "lib", "themes.ts"), "utf8");
    const match = themesFile.match(/export const themes = (.+);/s);
    expect(match).not.toBeNull();
    const themes = JSON.parse(match![1]).sort();
    expect(themes).toEqual(expected);
  });
});
