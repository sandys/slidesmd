// src/components/editor/ShareDialog.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ShareDialog } from "./ShareDialog";

const origin = window.location.origin;

describe("ShareDialog", () => {
  beforeEach(() => {
    window.location.hash = "#testkey";
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
    });
  });

  it("should not render when closed", () => {
    render(<ShareDialog isOpen={false} onClose={() => {}} publicId="abc" />);
    expect(screen.queryByText(/Share Presentation/)).not.toBeInTheDocument();
  });

  it("should show view link when open", () => {
    render(<ShareDialog isOpen onClose={() => {}} publicId="abc" />);
    expect(
      screen.getByDisplayValue(`${origin}/p/abc/h#testkey`)
    ).toBeInTheDocument();
  });

  it("should copy edit link to clipboard", async () => {
    render(
      <ShareDialog isOpen onClose={() => {}} publicId="abc" editKey="ed1" />
    );
    const copyButtons = screen.getAllByText("Copy");
    fireEvent.click(copyButtons[0]);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      `${origin}/p/abc/e/ed1/h#testkey`
    );
    await waitFor(() => {
      expect(screen.getByText("Copied!")).toBeInTheDocument();
    });
  });
});
