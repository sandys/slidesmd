// src/components/editor/ThemeSelector.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeSelector } from "./ThemeSelector";

// Mock the themes module
vi.mock("@/lib/themes", () => ({
  themes: ["black.css", "white.css", "league.css"],
}));

describe("ThemeSelector", () => {
  it("should render a dropdown with themes", () => {
    render(<ThemeSelector selectedTheme="black.css" onThemeChange={() => {}} />);
    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();
    fireEvent.click(select);
    const options = screen.getAllByRole("option");
    const texts = options.map((o) => o.textContent);
    expect(texts).toEqual(expect.arrayContaining(["Black", "White", "League"]));
  });

  it("should call onThemeChange when a new theme is selected", () => {
    const onThemeChange = vi.fn();
    render(
      <ThemeSelector selectedTheme="black.css" onThemeChange={onThemeChange} />,
    );
    const select = screen.getByRole("combobox");
    fireEvent.click(select);
    fireEvent.click(screen.getByText("White"));
    expect(onThemeChange).toHaveBeenCalledWith("white.css");
  });

  it("should display the correct selected theme", () => {
    render(<ThemeSelector selectedTheme="league.css" onThemeChange={() => {}} />);
    const select = screen.getByRole("combobox");
    expect(select).toHaveTextContent("League");
  });
});


