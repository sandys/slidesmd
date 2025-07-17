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

## 3. Key Process Learnings & Improvements

My development process has had several flaws that led to repeated errors. I will adhere to the following principles to ensure a higher standard of quality and efficiency.

1.  **Holistic User Journey First:** Before writing any code for a new feature, I must consider and outline the complete user experience from start to finish. This includes how the user discovers the feature, interacts with it, and what the final output is. I will not design back-end logic without a corresponding front-end interaction plan.

2.  **Verify, Then Propose:** Before proposing changes to critical configuration files (e.g., `next.config.ts`, `package.json`, build scripts), I will state the version of the tool I am targeting. I will not propose complex configurations from memory and will prioritize solutions grounded in official documentation.

3.  **Structured Debugging:** When faced with a silent failure (e.g., missing data, an empty UI element), my first step will be to add logging at each step of the data's lifecycle (source, transformation, destination) to pinpoint the exact point of failure before attempting a speculative fix.

4.  **Incremental Tooling Setup:** When adding a new tool (e.g., a test runner, linter), I will first create the simplest possible "hello world" configuration and test case to ensure the tool itself is working correctly before writing any feature-specific logic or tests.

5.  **Trust User Guidance:** I will give user-provided technical suggestions and corrections high priority in my solution planning, especially when they propose a simpler, more direct solution.

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