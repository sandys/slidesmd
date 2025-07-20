import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SlideEditor } from "./SlideEditor";

// Mock RevealPreview to avoid loading reveal.js in tests
vi.mock("./RevealPreview", () => ({
  RevealPreview: () => <div data-testid="reveal-preview" />,
}));

describe("SlideEditor", () => {
  it("allows editing by default", () => {
    const onChange = vi.fn();
    render(<SlideEditor content="test" onContentChange={onChange} theme="black.css" />);
    const textarea = screen.getByDisplayValue("test");
    expect(textarea).not.toBeDisabled();
    fireEvent.change(textarea, { target: { value: "updated" } });
    expect(onChange).toHaveBeenCalledWith("updated");
  });

  it("disables textarea and ignores changes when editable is false", () => {
    const onChange = vi.fn();
    render(
      <SlideEditor
        content="test"
        onContentChange={onChange}
        theme="black.css"
        editable={false}
      />,
    );
    const textarea = screen.getByDisplayValue("test");
    expect(textarea).toBeDisabled();
    fireEvent.change(textarea, { target: { value: "new" } });
    expect(onChange).not.toHaveBeenCalled();
  });
});
