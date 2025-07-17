// src/lib/crypto.test.ts
import { describe, it, expect } from "vitest";
import {
  generateNewKeyString,
  importKey,
  encrypt,
  decrypt,
  exportKeyToString,
} from "./crypto";

describe("Crypto Library", () => {
  it("should generate a URL-safe Base64 key", async () => {
    const keyString = await generateNewKeyString();
    expect(keyString).toBeTypeOf("string");
    expect(keyString).not.toContain("+");
    expect(keyString).not.toContain("/");
  });

  it("should encrypt and decrypt a message successfully", async () => {
    const keyString = await generateNewKeyString();
    const key = await importKey(keyString);
    const plaintext = "Hello, world!";
    const ciphertext = await encrypt(plaintext, key);
    const decrypted = await decrypt(ciphertext, key);
    expect(decrypted).toBe(plaintext);
  });

  it("should fail to decrypt with the wrong key", async () => {
    const key1 = await importKey(await generateNewKeyString());
    const key2 = await importKey(await generateNewKeyString());
    const plaintext = "This is a secret message.";
    const ciphertext = await encrypt(plaintext, key1);
    await expect(decrypt(ciphertext, key2)).rejects.toThrow();
  });

  it("should correctly import an exported key", async () => {
    const key = await importKey(await generateNewKeyString());
    const exported = await exportKeyToString(key);
    const imported = await importKey(exported);
    const exported2 = await exportKeyToString(imported);
    expect(exported).toEqual(exported2);
  });
});
