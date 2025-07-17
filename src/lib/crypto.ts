// src/lib/crypto.ts
"use client";

// This file contains client-side cryptography functions.

/**
 * Generates a new AES-256-GCM key.
 * @returns A new CryptoKey object.
 */
async function generateAesKey(): Promise<CryptoKey> {
  return await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Exports a CryptoKey to a URL-safe Base64 string.
 * @param key The CryptoKey to export.
 * @returns A URL-safe Base64 encoded string.
 */
export async function exportKeyToString(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey("raw", key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

/**
 * Imports a URL-safe Base64 string back into a CryptoKey.
 * @param keyString The URL-safe Base64 encoded key string.
 * @returns A CryptoKey object.
 */
async function importKeyFromString(keyString: string): Promise<CryptoKey> {
  const decoded = atob(keyString.replace(/-/g, "+").replace(/_/g, "/"));
  const buffer = new Uint8Array(decoded.length).map((_, i) =>
    decoded.charCodeAt(i)
  );
  return await window.crypto.subtle.importKey(
    "raw",
    buffer,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts a plaintext string with a given key.
 * @param plaintext The string to encrypt.
 * @param key The CryptoKey to use for encryption.
 * @returns A Base64 string containing the IV and ciphertext.
 */
export async function encrypt(
  plaintext: string,
  key: CryptoKey
): Promise<string> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    encoded
  );

  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts a ciphertext string with a given key.
 * @param ciphertextB64 The Base64 encoded ciphertext (IV + data).
 * @param key The CryptoKey to use for decryption.
 * @returns The original plaintext string.
 */
export async function decrypt(
  ciphertextB64: string,
  key: CryptoKey
): Promise<string> {
  try {
    const combined = Uint8Array.from(atob(ciphertextB64), (c) => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Decryption failed. The key may be invalid or the data corrupted.");
  }
}

/**
 * A wrapper function to generate a new key and export it as a string.
 */
export async function generateNewKeyString(): Promise<string> {
    const key = await generateAesKey();
    return exportKeyToString(key);
}

/**
 * A wrapper function to import a key string for use in encryption/decryption.
 */
export async function importKey(keyString: string): Promise<CryptoKey> {
    return importKeyFromString(keyString);
}
