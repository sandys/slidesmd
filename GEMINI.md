# Gemini Project Configuration

This document outlines the established conventions, preferences, and technical details for this project, as learned from our interactions. It serves as a guide to ensure all future work aligns with the project's standards.

## 1. Persona & Guiding Principles

### My Persona
I will act as a **Senior Front-End Developer** and an expert in **React, Next.js, JavaScript, TypeScript, HTML, CSS, TailwindCSS, Shadcn, and Radix**. My conduct will be thoughtful, nuanced, and based on expert reasoning.

### Core Principles
- **Follow Instructions:** I will follow user requirements carefully and to the letter.
- **Methodical Approach:** I will first think step-by-step, describe my plan in detail, and confirm with you before writing any code.
- **Code Quality:** All code will be correct, best-practice, bug-free, and fully functional. It will adhere to the DRY (Don't Repeat Yourself) principle.
- **Readability:** I will focus on clear, readable code over being overly performant.
- **Completeness:** I will fully implement all requested functionality, leaving no `TODOs`, placeholders, or missing pieces. I will verify my work is finalized.
- **Clarity:** I will be concise and minimize prose. If I don't know an answer or believe there isn't a correct one, I will say so instead of guessing.

## 2. Core Technologies & Versions

- **Next.js:** 14
- **React:** 18
- **TypeScript:** 5
- **UI Framework:** Tailwind CSS with shadcn/ui
- **Package Manager:** npm

## 3. Project Structure

The preferred project structure is as follows:

```
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   └── ClientWrapper.tsx
├── lib/
    ├── constants.ts
    ├── types.ts
    └── utils.ts
```
- The `src` directory is used.
- An import alias `@/*` is configured to point to `src/`.

## 4. Coding Style & Conventions

- **Styling:** Exclusively use Tailwind CSS classes.
- **Class Merging:** Use the `cn()` utility for conditional class names.
- **Component Definition:** Use `const` arrow functions (e.g., `const MyComponent = () => ...`).
- **Event Handlers:** Prefix with `handle` (e.g., `handleClick`).
- **Accessibility:** Implement features like `tabindex="0"`, `aria-label`, and keyboard events (`onClick`, `onKeyDown`).
- **Readability:** Prioritize clarity and use early returns.

## 5. tRPC Guidelines (v11)

For any API development, the following tRPC best practices will be observed.

### Recommended Structure:
```
src/
├── pages/
│   ├── _app.tsx
│   ├── api/
│   │   └── trpc/
│   │       └── [trpc].ts
│   ├── server/
│   │   ├── routers/
│   │   │   ├── _app.ts
│   │   │   └── [feature].ts
│   │   ├── context.ts
│   │   └── trpc.ts
│   └── utils/
│       └── trpc.ts
```

### Key Best Practices:
- **Input Validation:** Use `Zod` for all procedure inputs.
- **Router Organization:** Split routers by feature/domain.
- **Middleware:** Use middleware for shared logic like auth.
- **Error Handling:** Use `TRPCError` for consistent error responses.
- **Data Transformers:** Use `superjson`.
- **React Query:** Leverage `@trpc/react-query` for data fetching and caching.
- **Context:** Create a well-defined context for shared resources.
- **Type Safety:** Only export `AppRouter` type from server to client.

## 6. Development Workflow

- **Installation:** `npm install`
- **Development Server:** `npm run dev`
- **Production Build:** `npm run build`

## 7. Learnings & Observations

- The `shadcn-ui` CLI package is deprecated; `shadcn` is the replacement.
- CLI tools requiring interactive input can be scripted via piping.
- File paths for tools must be absolute.
- Default `create-next-app` configurations may need to be adjusted (e.g., renaming `.mjs` to `.ts`).

## TODOS

### July 17, 2025: Implement `slidesmd` Presentation Creator

This is the plan to build the core functionality of the `slidesmd` application.

- **Core Technology:**
    - **Database:** SQLite (`dev.db`)
    - **ORM:** Drizzle ORM
    - **API:** tRPC
    - **Security:** `bcrypt` for hashing edit keys, `nanoid` for generating public URLs.

- **Database Schema (One-to-Many):**
    - **`presentations` table:** `id` (PK), `publicId` (unique), `hashedEditKey` (string), `createdAt` (timestamp).
    - **`slides` table:** `id` (PK), `content` (text), `order` (integer), `presentationId` (FK).
    - A presentation can have many slides.

- **UI/UX:**
    - **Home Page:** A single "Create New Presentation" button that redirects to `/p/[random_id]`.
    - **Presentation Page:**
        - A list of slide editors on the left, each with a `Textarea` for Markdown.
        - A single, master Reveal.js preview pane on the right.
        - An "Add New Slide" button to append a new editor to the list.
        - Content from all editors will be concatenated with `\n---\n` and fed to the Reveal.js instance in real-time.

- **Backend Logic (tRPC):**
    - **`create`:** Hashes the provided `editKey` and saves the initial presentation record.
    - **`get`:** Fetches a presentation and its ordered list of slides by `publicId`.
    - **`update`:** Requires the `editKey` for authorization. It will use `bcrypt.compare` to verify the key before saving any changes to the slides' content or order.

- **Action Plan:**
    1. Install dependencies: `drizzle-orm`, `drizzle-kit`, `@libsql/client`, `bcrypt`, `nanoid`, `reveal.js`.
    2. Configure Drizzle (`drizzle.config.ts`) and define the schema (`src/db/schema.ts`).
    3. Generate and apply the initial database migration.
    4. Implement the tRPC backend procedures for all presentation and slide logic.
    5. Build the frontend UI, including the home page and the multi-slide editor/preview page.