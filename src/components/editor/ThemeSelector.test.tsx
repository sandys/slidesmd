// src/components/editor/ThemeSelector.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeSelector } from "./ThemeSelector";
import { themes } from "@/lib/themes";

// Mock the themes module
vi.mock("@/lib/themes", () => ({
  themes: ["black.css", "white.css", "league.css"],
}));

describe("ThemeSelector", () => {
  it("should render a dropdown with themes", () => {
    render(<ThemeSelector selectedTheme="black.css" onThemeChange={() => {}} />);
    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();
    expect(screen.getByText("Black")).toBeInTheDocument();
    expect(screen.getByText("White")).toBeInTheDocument();
    expect(screen.getByText("League")).toBeInTheDocument();
  });

  it("should call onThemeChange when a new theme is selected", () => {
    const onThemeChange = vi.fn();
    render(<ThemeSelector selectedTheme="black.css" onThemeChange={onThemeChange} />);
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "white.css" } });
    expect(onThemeChange).toHaveBeenCalledWith("white.css");
  });

  it("should display the correct selected theme", () => {
    render(<ThemeSelector selectedTheme="league.css" onThemeChange={() => {}} />);
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("league.css");
  });
});
