// src/components/editor/PresentationEditor.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";
import { PresentationEditor } from "./PresentationEditor";
import * as crypto from "@/lib/crypto";
import * as actions from "@/app/actions";

// Mock dependencies
vi.mock("@/lib/crypto");
vi.mock("@/app/actions");
vi.mock("./RevealDeck", () => ({
  RevealDeck: () => <div data-testid="reveal-deck" />,
}));
vi.mock("./ThemeSelector", () => ({
  ThemeSelector: ({
    selectedTheme,
    onThemeChange,
  }: {
    selectedTheme: string;
    onThemeChange: (t: string) => void;
  }) => (
    <button data-testid="theme-selector" onClick={() => onThemeChange("sky.css")}>
      {selectedTheme}
    </button>
  ),
}));

type Presentation = ComponentProps<typeof PresentationEditor>["presentation"];

const mockPresentation = {
  id: 1,
  publicId: "test-public-id",
  hashedEditKey: "hashed",
  createdAt: 0,
  theme: "black.css",
  slides: [{ id: 1, content: "encrypted", order: 1, presentationId: 1 }],
} as unknown as Presentation;

const mockEditKey = "test-edit-key";

describe("PresentationEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.location.hash = "#test-key";
  });

  it("should show an error message if encryption fails on save", async () => {
    const errorMessage = "Test encryption error";
    vi.mocked(crypto.importKey).mockResolvedValue({} as CryptoKey);
    vi.mocked(crypto.encrypt).mockRejectedValue(new Error(errorMessage));

    render(
      <PresentationEditor
        presentation={mockPresentation}
        doc="# Hello"
        primarySlideId={1}
        editKeyFromUrl={mockEditKey}
      />
    );

    fireEvent.click(screen.getByText("Save Changes"));

    await waitFor(() => {
      expect(
        screen.getByText(`Error saving: ${errorMessage}`)
      ).toBeInTheDocument();
    });

    expect(actions.updatePresentation).not.toHaveBeenCalled();
  });

  it("should show an error if save is attempted without a key", async () => {
    window.location.hash = ""; // No key

    render(
      <PresentationEditor
        presentation={mockPresentation}
        doc="# Hello"
        primarySlideId={1}
        editKeyFromUrl={mockEditKey}
      />
    );

    fireEvent.click(screen.getByText("Save Changes"));

    await waitFor(() => {
      expect(
        screen.getByText("Cannot save. Decryption key or edit key is missing.")
      ).toBeInTheDocument();
    });
  });

  it("disables editing when no edit key is provided", () => {
    render(
      <PresentationEditor presentation={mockPresentation} doc="# Hello" primarySlideId={1} />
    );

    const textarea = screen.getByDisplayValue("# Hello");
    const saveBtn = screen.getByText("Save Changes");

    expect(textarea).toBeDisabled();
    expect(saveBtn).toBeDisabled();
  });

  it("saves the whole document as one encrypted slide with the front-matter theme", async () => {
    vi.mocked(crypto.importKey).mockResolvedValue({} as CryptoKey);
    vi.mocked(crypto.encrypt).mockResolvedValue("encrypted-doc");
    vi.mocked(actions.updatePresentation).mockResolvedValue(undefined);

    render(
      <PresentationEditor
        presentation={mockPresentation}
        doc={"---\ntheme: moon\n---\n# Hello"}
        primarySlideId={7}
        editKeyFromUrl={mockEditKey}
      />
    );

    fireEvent.click(screen.getByText("Save Changes"));

    await waitFor(() => {
      expect(screen.getByText("Presentation saved!")).toBeInTheDocument();
    });
    expect(actions.updatePresentation).toHaveBeenCalledWith(
      "test-public-id",
      mockEditKey,
      [{ id: 7, content: "encrypted-doc", order: 1 }],
      "moon.css"
    );
  });

  it("rewrites the front-matter theme line when the selector changes", () => {
    render(
      <PresentationEditor
        presentation={mockPresentation}
        doc="# Hello"
        primarySlideId={1}
        editKeyFromUrl={mockEditKey}
      />
    );

    // falls back to the presentation theme before any front matter exists
    expect(screen.getByTestId("theme-selector")).toHaveTextContent("black.css");

    fireEvent.click(screen.getByTestId("theme-selector"));

    const textarea = screen.getByRole("textbox", { name: "Presentation markdown" });
    expect((textarea as HTMLTextAreaElement).value).toBe(
      "---\ntheme: sky.css\n---\n\n# Hello"
    );
    expect(screen.getByTestId("theme-selector")).toHaveTextContent("sky.css");
  });
});
