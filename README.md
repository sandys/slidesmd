# SlidesMD

SlidesMD is a lightweight presentation tool built with Next.js 15 and React. Slides are written in Markdown and rendered with [Reveal.js](https://revealjs.com/). All slide content is encrypted client‑side before it is stored in the database. Sharing a presentation is as simple as sending a link that contains the decryption key in the URL fragment.

## Features

- **Markdown Slides** – Edit slides in Markdown with a live preview.
- **End‑to‑End Encryption** – Slides are encrypted in the browser using AES‑26‑GCM; the server only stores ciphertext.
- **Shareable Links** – Generate private edit links and read‑only view links from the Share dialog.
- **Theme Selector** – Choose from bundled Reveal.js themes.
- **Presenter/Print View** – Export presentations to PDF via the presenter view.

## Getting Started

Install dependencies and generate Reveal.js themes:

```bash
npm install
npm run generate-themes
```

Start the development server:

```bash
npm run dev
```

Open <http://localhost:3000> in your browser to create a new presentation.

## Development

- Use the [shadcn/ui CLI](https://ui.shadcn.com/docs/cli) when adding new components.
- Server actions in `src/app/actions.ts` handle all database operations via Drizzle ORM and SQLite.
- Client‑side cryptography utilities live in `src/lib/crypto.ts`.

Run linting and tests before committing:

```bash
npm run lint
npx vitest run
```

## Building for Production

```bash
npm run build
npm start
```

The build output is served by Next.js.

## License

SlidesMD is released under the GNU GPL‑3.0 License. See [LICENSE](LICENSE) for details.
