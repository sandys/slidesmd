// src/components/editor/DecryptionWrapper.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { DecryptionWrapper } from "./DecryptionWrapper";
import * as crypto from "@/lib/crypto";

// Mock the crypto library
vi.mock("@/lib/crypto", () => ({
  importKey: vi.fn(),
  decrypt: vi.fn(),
}));

// Mock the PresentationEditor component
vi.mock("./PresentationEditor", () => ({
  PresentationEditor: () => <div data-testid="presentation-editor" />,
}));

const mockPresentation = {
  id: 1,
  publicId: "test-public-id",
  hashedEditKey: "test-hashed-key",
  createdAt: new Date(),
  slides: [{ id: 1, content: "encrypted-content", order: 1, presentationId: 1 }],
};

describe("DecryptionWrapper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.location.hash = "#test-key";
  });

  it("should show an error message if decryption fails", async () => {
    const errorMessage = "Test decryption error";
    vi.mocked(crypto.importKey).mockResolvedValue({} as CryptoKey);
    vi.mocked(crypto.decrypt).mockRejectedValue(new Error(errorMessage));

    render(<DecryptionWrapper presentation={mockPresentation} />);

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

    render(<DecryptionWrapper presentation={mockPresentation} />);

    await waitFor(() => {
      expect(
        screen.getByText("No decryption key found in URL. Please use a link with a key.")
      ).toBeInTheDocument();
    });
  });
});
