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

## 2. Core Technologies & Architecture

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **UI:** React, Tailwind CSS, shadcn/ui
- **Data Layer:** Server Actions
- **Database:** SQLite
- **ORM:** Drizzle
- **Package Manager:** npm

## 3. Project Evolution & Learnings

This section documents the significant architectural changes and the key lessons learned during development.

### Architectural Pivot: From tRPC to Server Actions
The project initially started with a plan to use tRPC for the API layer. However, we made a decisive pivot to a more modern and streamlined architecture using **Next.js Server Actions**.

- **Rationale:** This change simplifies the codebase significantly by removing the need for a separate API layer, client-side data fetching libraries, and the associated boilerplate. Backend logic is now co-located with the components that use it, improving maintainability.
- **Implementation:** All tRPC-related packages, files, and configurations were removed. Data fetching and mutations are now handled by server functions defined in `src/app/actions.ts` and called directly from React components.

### Key Process Learnings & Improvements

My development process has had several flaws that led to repeated errors and incorrect solutions. I have internalized the following lessons to improve future performance:

1.  **Build-Tool-First Approach:** My biggest mistake was attempting to solve problems with surface-level application code (e.g., API routes, file-system scripts) when the correct solution lay in the build system. I repeatedly failed to correctly configure Webpack and Turbopack.
    *   **The New Process:** For tasks involving assets, dependencies, or environment-specific data, I will **always** consider a build-tool solution (e.g., a loader) first. I will not write a single line of application code for this until I have proven that the build tool is correctly providing the necessary data.
    *   **Lesson:** A silent failure (like an empty dropdown) almost always points to a misconfigured loader or plugin that is failing gracefully. My first step must be to make the build-tool error **loud and explicit** to diagnose the root cause, rather than debugging the application code that consumes the (missing) data.

2.  **Mastering Next.js Configuration:** I demonstrated a critical lack of knowledge regarding `next.config.ts`, causing multiple errors.
    *   **`rewrites` vs. API Routes:** I now understand that `rewrites` are for URL-to-URL mapping, not for serving files from `node_modules`. The correct pattern for serving node module assets is a dedicated API route that reads the file.
    *   **Turbopack vs. Webpack:** I now know that Turbopack and Webpack have distinct loader configurations in `next.config.ts`. I must provide correct rules for both if the project uses Turbopack for development. Turbopack rules require globs (`**/path/to/file.ts`) whereas Webpack can use absolute paths.
    *   **Staying Current:** I failed to recognize that `params` in Next.js 15 API routes are now promises that must be `await`ed. I will be more vigilant about checking the documentation for the specific framework version in use.

3.  **Trusting User Guidance:** I initially dismissed your suggestion to use the `readonly` attribute, which was the correct and simplest solution. I will give user-provided technical suggestions higher priority in my solution planning.

## 4. Future Features / TODO

This section outlines planned features that have been discussed and are pending implementation.

### Client-Side Presentation Encryption

**Goal:** Implement end-to-end encryption for presentations, ensuring the server has zero knowledge of the plaintext content.

**Core Components:**
1.  **Cryptography Library (`src/lib/crypto.ts`):**
    *   A client-side-only module using the Web Crypto API (AES-256-GCM).
    *   Will provide `encrypt` and `decrypt` functions.
    *   The key will be a URL-safe Base64 string.

2.  **URL Structure:**
    *   **View URL:** `.../p/<presentation-id>/h#<decryption-key>`
    *   **Edit URL:** `.../p/<presentation-id>/e/<edit-key>/h#<decryption-key>`
    *   The decryption key will *only* exist in the URL fragment (`#`) to prevent it from being sent to the server.

3.  **Middleware Validation (`src/middleware.ts`):**
    *   A new middleware will validate that the `/h` segment is always at the end of the URL path, blocking any malformed requests with a 400 error.

4.  **Database & Server Actions:**
    *   The `slides.content` column will be renamed to `slides.encryptedContent`.
    *   Server actions will be updated to only ever receive and store this encrypted content.

5.  **UI/UX for Link Management:**
    *   After creating/saving, a **Share Modal** will appear.
    *   This modal will provide two distinct, clearly labeled links: the private "Edit URL" and the shareable "View URL".
    *   A persistent "Share" button will be added to the editor UI to access this modal at any time.
    *   The old "Enter Edit Key" flow will be removed entirely, as access is now managed by having the correct URL.
