// src/components/editor/DecryptionWrapper.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";
import { DecryptionWrapper } from "./DecryptionWrapper";
import * as crypto from "@/lib/crypto";

// Mock the crypto library
vi.mock("@/lib/crypto", () => ({
  importKey: vi.fn(),
  decrypt: vi.fn(),
}));

// Mock the editor and deck so reveal.js never loads in tests
vi.mock("./PresentationEditor", () => ({
  PresentationEditor: (props: { doc: string }) => (
    <div data-testid="presentation-editor">{props.doc}</div>
  ),
}));
vi.mock("./RevealDeck", () => ({
  RevealDeck: (props: { doc: string; mode: string }) => (
    <div data-testid="reveal-deck" data-mode={props.mode}>
      {props.doc}
    </div>
  ),
}));

type Presentation = ComponentProps<typeof DecryptionWrapper>["presentation"];

const mockPresentation = {
  id: 1,
  publicId: "test-public-id",
  hashedEditKey: "test-hashed-key",
  createdAt: 0,
  theme: "black.css",
  slides: [
    { id: 1, content: "encrypted-1", order: 1, presentationId: 1 },
    { id: 2, content: "encrypted-2", order: 2, presentationId: 1 },
  ],
} as unknown as Presentation;

describe("DecryptionWrapper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.location.hash = "#test-key";
  });

  it("should show an error message if decryption fails", async () => {
    const errorMessage = "Test decryption error";
    vi.mocked(crypto.importKey).mockResolvedValue({} as CryptoKey);
    vi.mocked(crypto.decrypt).mockRejectedValue(new Error(errorMessage));

    render(<DecryptionWrapper presentation={mockPresentation} mode="edit" />);

    // Wait for the error message to appear
    await waitFor(() => {
      const errorElement = screen.getByText(
        /Failed to decrypt presentation\. The key may be invalid or the data corrupted\./
      );
      expect(errorElement).toBeInTheDocument();
    });

    // Ensure the editor is not rendered
    expect(screen.queryByTestId("presentation-editor")).not.toBeInTheDocument();
  });

  it("should show an error if the decryption key is missing from the URL", async () => {
    window.location.hash = ""; // No key in URL

    render(<DecryptionWrapper presentation={mockPresentation} mode="edit" />);

    await waitFor(() => {
      expect(
        screen.getByText("No decryption key found in URL. Please use a link with a key.")
      ).toBeInTheDocument();
    });
  });

  it("joins legacy multi-row decks into one document for the editor", async () => {
    vi.mocked(crypto.importKey).mockResolvedValue({} as CryptoKey);
    vi.mocked(crypto.decrypt).mockImplementation((content) =>
      Promise.resolve(content.replace("encrypted", "# slide"))
    );

    render(<DecryptionWrapper presentation={mockPresentation} mode="edit" />);

    await waitFor(() => {
      expect(screen.getByTestId("presentation-editor")).toHaveTextContent(
        "# slide-1 --- # slide-2"
      );
    });
  });

  it("renders the deck for view mode", async () => {
    vi.mocked(crypto.importKey).mockResolvedValue({} as CryptoKey);
    vi.mocked(crypto.decrypt).mockResolvedValue("# decrypted");

    render(<DecryptionWrapper presentation={mockPresentation} mode="view" />);

    await waitFor(() => {
      const deck = screen.getByTestId("reveal-deck");
      expect(deck).toBeInTheDocument();
      expect(deck.getAttribute("data-mode")).toBe("view");
    });
    expect(screen.queryByTestId("presentation-editor")).not.toBeInTheDocument();
  });
});
