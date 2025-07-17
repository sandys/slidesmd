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

My initial development process had several flaws that led to repeated errors. I have internalized the following lessons to improve future performance:

1.  **Dependency-First Workflow:** My most significant mistake was writing code that used packages before they were installed. **The new process is to first analyze the requirements of a task, identify all necessary dependencies, install them comprehensively, and only then begin implementation.** This prevents the frequent and frustrating `Module not found` errors.

2.  **Thorough Requirement Verification:** I misunderstood the core UI requirement for the slide editor, leading to significant rework. **I will now be more diligent in re-stating my understanding of complex UI requirements before implementation to ensure alignment.**

3.  **Careful Library Integration:** Integrating third-party libraries requires care.
    *   **DOM Manipulation (`reveal.js`):** I learned to respect the React component lifecycle, using `useEffect` for one-time initialization and a `key` prop to declaratively handle re-renders, preventing conflicts with React's virtual DOM.
    *   **Server/Client Boundaries:** I now understand that complex objects like `Headers` are not passed directly from Server to Client Components. They must be serialized into plain objects first.

4.  **Anticipating Data Types:** I failed to correctly handle the `number | bigint` return type from Drizzle's `lastInsertRowid`. **I will now be more defensive in my coding, anticipating and correctly handling the specific data types returned by databases and libraries.**
