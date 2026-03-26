import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { SavedAddress } from "@/types/address";
import { ProfileClient } from "../profile-client";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const { mockToast } = vi.hoisted(() => ({
  mockToast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock("sonner", () => ({
  toast: mockToast,
}));

// Mock child components to isolate ProfileClient logic
vi.mock("../address-card", () => ({
  AddressCard: ({
    address,
    onEdit,
    onDelete,
  }: {
    address: SavedAddress;
    onEdit: () => void;
    onDelete: () => void;
  }) => (
    <div data-testid={`address-card-${address.id}`}>
      <span>{address.label}</span>
      <span>
        {address.firstName} {address.lastName}
      </span>
      <button data-testid={`edit-${address.id}`} onClick={onEdit}>
        Edit
      </button>
      <button data-testid={`delete-${address.id}`} onClick={onDelete}>
        Delete
      </button>
    </div>
  ),
}));

vi.mock("../address-dialog", () => ({
  AddressDialog: ({
    open,
    onOpenChange,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) =>
    open ? (
      <div data-testid="address-dialog">
        <button onClick={() => onOpenChange(false)}>Close</button>
      </div>
    ) : null,
}));

const mockAddress: SavedAddress = {
  id: "addr-1",
  userId: "user-1",
  label: "Home",
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  street: "123 Main St",
  city: "Melbourne",
  state: "VIC",
  zipcode: "3000",
  country: "Australia",
  phone: "+61412345678",
  isDefault: true,
  createdAt: "2026-01-01T00:00:00Z",
};

beforeEach(() => {
  vi.restoreAllMocks();
  global.fetch = vi.fn();
});

describe("ProfileClient", () => {
  it("renders profile info and addresses", () => {
    render(
      <ProfileClient
        initialName="John Doe"
        email="john@example.com"
        initialAddresses={[mockAddress]}
      />,
    );

    expect(screen.getByLabelText("Name")).toHaveValue("John Doe");
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
    expect(screen.getByTestId("address-card-addr-1")).toBeInTheDocument();
  });

  it("shows empty state when no addresses", () => {
    render(
      <ProfileClient
        initialName="John"
        email="john@example.com"
        initialAddresses={[]}
      />,
    );

    expect(
      screen.getByText("No saved addresses yet. Add one to speed up checkout."),
    ).toBeInTheDocument();
  });

  it("updates name on save", async () => {
    const user = userEvent.setup();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true, data: { name: "Jane" } }),
    });

    render(
      <ProfileClient
        initialName="John"
        email="john@example.com"
        initialAddresses={[]}
      />,
    );

    const nameInput = screen.getByLabelText("Name");
    await user.clear(nameInput);
    await user.type(nameInput, "Jane");
    await user.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith("Name updated");
    });
  });

  it("opens address dialog when Add Address is clicked", async () => {
    const user = userEvent.setup();

    render(
      <ProfileClient
        initialName="John"
        email="john@example.com"
        initialAddresses={[]}
      />,
    );

    await user.click(screen.getByText("Add Address"));

    expect(screen.getByTestId("address-dialog")).toBeInTheDocument();
  });

  it("deletes address on confirmation", async () => {
    const user = userEvent.setup();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () =>
        Promise.resolve({ success: true, message: "Address deleted" }),
    });

    render(
      <ProfileClient
        initialName="John"
        email="john@example.com"
        initialAddresses={[mockAddress]}
      />,
    );

    await user.click(screen.getByTestId("delete-addr-1"));

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith("Address deleted");
    });
    expect(
      screen.queryByTestId("address-card-addr-1"),
    ).not.toBeInTheDocument();
  });
});
