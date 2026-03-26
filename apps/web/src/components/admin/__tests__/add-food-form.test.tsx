import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AddFoodForm } from "../add-food-form";

vi.mock("next/image", () => ({
  default: function MockImage(props: Record<string, unknown>) {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("AddFoodForm", () => {
  it("renders form fields", () => {
    render(<AddFoodForm />);

    expect(screen.getByRole("heading", { name: "Add Food Item" })).toBeInTheDocument();
    expect(screen.getByLabelText("Product Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Product Description")).toBeInTheDocument();
    expect(screen.getByLabelText("Price ($)")).toBeInTheDocument();
    expect(screen.getByText("Upload Image")).toBeInTheDocument();
  });

  it("renders the submit button", () => {
    render(<AddFoodForm />);

    expect(screen.getByRole("button", { name: "Add Food Item" })).toBeInTheDocument();
  });

  it("shows image error when no image is selected on submit", async () => {
    render(<AddFoodForm />);

    fireEvent.change(screen.getByLabelText("Product Name"), {
      target: { value: "Test Food" },
    });
    fireEvent.change(screen.getByLabelText("Product Description"), {
      target: { value: "A tasty test food item" },
    });
    fireEvent.change(screen.getByLabelText("Price ($)"), {
      target: { value: "15" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Add Food Item" }));

    await waitFor(() => {
      expect(screen.getByText("Please select an image")).toBeInTheDocument();
    });
  });

  it("validates image file type", () => {
    render(<AddFoodForm />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const invalidFile = new File(["content"], "test.pdf", { type: "application/pdf" });

    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    expect(
      screen.getByText("Only JPEG, PNG, WebP, and GIF images are accepted"),
    ).toBeInTheDocument();
  });

  it("validates image file size", () => {
    render(<AddFoodForm />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    // Create a file larger than 5MB
    const largeContent = new Uint8Array(6 * 1024 * 1024);
    const largeFile = new File([largeContent], "big.png", { type: "image/png" });

    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    expect(screen.getByText("Image must be smaller than 5MB")).toBeInTheDocument();
  });

  it("accepts valid image file", () => {
    render(<AddFoodForm />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const validFile = new File(["image-data"], "food.png", { type: "image/png" });

    fireEvent.change(fileInput, { target: { files: [validFile] } });

    expect(
      screen.queryByText("Only JPEG, PNG, WebP, and GIF images are accepted"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Image must be smaller than 5MB")).not.toBeInTheDocument();
  });

  it("shows validation errors for empty required fields", async () => {
    render(<AddFoodForm />);

    // Provide an image so the image validation doesn't block submission
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const validFile = new File(["image-data"], "food.png", { type: "image/png" });
    fireEvent.change(fileInput, { target: { files: [validFile] } });

    fireEvent.click(screen.getByRole("button", { name: "Add Food Item" }));

    await waitFor(() => {
      // Zod should report validation errors for empty name/description
      expect(screen.getByText("Name is required")).toBeInTheDocument();
    });
  });
});
