// src/components/SubmitButton.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { SubmitButton } from "./SubmitButton";
import * as ReactDOM from "react-dom";
import type { FormStatus } from "react-dom";

// A simple wrapper to simulate being inside a <form>
const FormWrapper = ({ children }: { children: React.ReactNode }) => (
  <form>{children}</form>
);

// Mock the entire 'react-dom' module
vi.mock("react-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof ReactDOM>();
  return {
    ...actual,
    useFormStatus: vi.fn(),
  };
});

describe("SubmitButton", () => {
  const useFormStatusMock = vi.mocked(ReactDOM.useFormStatus);

  beforeEach(() => {
    // Reset the mock before each test
    useFormStatusMock.mockClear();
  });

  it("should render the default state when not pending", () => {
    useFormStatusMock.mockReturnValue({ pending: false } as FormStatus);

    render(
      <FormWrapper>
        <SubmitButton />
      </FormWrapper>
    );
    const button = screen.getByRole("button", { name: /Create New Presentation/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it("should render the pending state", () => {
    useFormStatusMock.mockReturnValue({ pending: true } as FormStatus);

    render(
      <FormWrapper>
        <SubmitButton />
      </FormWrapper>
    );
    const button = screen.getByRole("button", { name: /Creating.../i });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });
});
