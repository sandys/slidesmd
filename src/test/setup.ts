// src/test/setup.ts
import "@testing-library/jest-dom";
import { vi } from "vitest";

vi.mock("reveal.js/dist/reveal.css", () => ({
    default: "",
}));
vi.mock("reveal.js/dist/theme/black.css", () => ({
    default: "",
}));
vi.mock("reveal.js/dist/theme/white.css", () => ({
    default: "",
}));
vi.mock("reveal.js/dist/theme/league.css", () => ({
    default: "",
}));
vi.mock("reveal.js/dist/theme/beige.css", () => ({
    default: "",
}));
vi.mock("reveal.js/dist/theme/sky.css", () => ({
    default: "",
}));
vi.mock("reveal.js/dist/theme/night.css", () => ({
    default: "",
}));
vi.mock("reveal.js/dist/theme/serif.css", () => ({
    default: "",
}));
vi.mock("reveal.js/dist/theme/simple.css", () => ({
    default: "",
}));
vi.mock("reveal.js/dist/theme/solarized.css", () => ({
    default: "",
}));
vi.mock("reveal.js/dist/theme/blood.css", () => ({
    default: "",
}));
vi.mock("reveal.js/dist/theme/moon.css", () => ({
    default: "",
}));
