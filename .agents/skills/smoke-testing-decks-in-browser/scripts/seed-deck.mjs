// Seed (or remove) an encrypted smoke-test deck in dev.db, bypassing the UI.
// Run from the repo root (needs the repo's node_modules):
//   node .agents/skills/smoke-testing-decks-in-browser/scripts/seed-deck.mjs
//   node .agents/skills/smoke-testing-decks-in-browser/scripts/seed-deck.mjs --cleanup
// Prints KEY= and ready-to-open URLs. Always run --cleanup afterwards:
// dev.db is committed to the repo.
import { createClient } from "@libsql/client";
import bcrypt from "bcrypt";

const PUBLIC_ID = "smoketest";
const EDIT_KEY = "smokeeditkey";
const db = createClient({ url: "file:dev.db" });

// Explicit child-first delete: don't rely on SQLite FK cascade being enabled.
async function removeDeck() {
  await db.execute({
    sql: "DELETE FROM slides WHERE presentation_id IN (SELECT id FROM presentations WHERE public_id = ?)",
    args: [PUBLIC_ID],
  });
  const r = await db.execute({
    sql: "DELETE FROM presentations WHERE public_id = ?",
    args: [PUBLIC_ID],
  });
  return r.rowsAffected;
}

if (process.argv.includes("--cleanup")) {
  console.log("removed smoke deck(s):", await removeDeck());
  process.exit(0);
}

// Exercises: front matter theme, --- separators, Note:, ::: cols layout,
// chart fence, footer with {{page}}/{{total}} tokens, slide numbers with a
// custom position, and a per-slide data-header override.
const DOC = `---
theme: bento.css
footer: smoke deck · {{page}}/{{total}}
slideNumber: c/t
slideNumberPosition: top-right
---

# Smoke A

Note: speaker note here

---

<!-- .slide: data-header="Custom header" -->

## Smoke B

::: cols

left column

:::split

right column

:::

---

\`\`\`chart
{ "preset": "bar", "height": 300 }
\`\`\`
`;

// Same crypto as src/lib/crypto.ts: AES-256-GCM, 12-byte IV prepended,
// standard base64 in the DB, URL-safe base64 key in the fragment.
const subtle = globalThis.crypto.subtle;
const key = await subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
const keyString = Buffer.from(await subtle.exportKey("raw", key))
  .toString("base64")
  .replace(/\+/g, "-")
  .replace(/\//g, "_");
const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
const ciphertext = new Uint8Array(
  await subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(DOC)),
);
const stored = Buffer.concat([Buffer.from(iv), Buffer.from(ciphertext)]).toString("base64");

await removeDeck();
const res = await db.execute({
  sql: "INSERT INTO presentations (public_id, hashed_edit_key, theme) VALUES (?, ?, ?)",
  args: [PUBLIC_ID, await bcrypt.hash(EDIT_KEY, 10), "black.css"],
});
await db.execute({
  sql: 'INSERT INTO slides (content, "order", presentation_id) VALUES (?, 1, ?)',
  args: [stored, Number(res.lastInsertRowid)],
});

console.log(`KEY=${keyString}`);
console.log(`EDIT=http://localhost:3000/p/${PUBLIC_ID}/e/${EDIT_KEY}/h#${keyString}`);
console.log(`VIEW=http://localhost:3000/p/${PUBLIC_ID}/v#${keyString}`);
console.log(`PRESENT=http://localhost:3000/present/p/${PUBLIC_ID}/h#${keyString}`);
