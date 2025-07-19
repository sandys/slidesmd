// src/components/editor/PresentationEditor.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PresentationEditor } from "./PresentationEditor";
import * as crypto from "@/lib/crypto";
import * as actions from "@/app/actions";

// Mock dependencies
vi.mock("@/lib/crypto");
vi.mock("@/app/actions");
vi.mock("@/lib/themes", () => ({
  themes: ["black.css", "white.css", "league.css"],
}));

const mockPresentation = {
  id: 1,
  publicId: "test-public-id",
  slides: [{ id: 1, content: "decrypted-content", order: 1, presentationId: 1 }],
};

const mockEditKey = "test-edit-key";

describe("PresentationEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.location.hash = "#test-key";
    window.alert = vi.fn(); // Mock window.alert
  });

  it("should show an error alert if encryption fails on save", async () => {
    const errorMessage = "Test encryption error";
    vi.mocked(crypto.importKey).mockResolvedValue({} as CryptoKey);
    vi.mocked(crypto.encrypt).mockRejectedValue(new Error(errorMessage));

    render(
      <PresentationEditor
        presentation={mockPresentation}
        editKeyFromUrl={mockEditKey}
      />
    );

    // Click the save button
    fireEvent.click(screen.getByText("Save Changes"));

    // Wait for the alert to be called
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        `Error saving: ${errorMessage}`
      );
    });

    // Ensure updatePresentation was not called
    expect(actions.updatePresentation).not.toHaveBeenCalled();
  });

  it("should show an error if save is attempted without a key", async () => {
    window.location.hash = ""; // No key

    render(
      <PresentationEditor
        presentation={mockPresentation}
        editKeyFromUrl={mockEditKey}
      />
    );

    fireEvent.click(screen.getByText("Save Changes"));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        "Cannot save. Decryption key or edit key is missing."
      );
    });
  });
});
