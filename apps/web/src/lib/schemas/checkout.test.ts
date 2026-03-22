import { describe, expect, it } from "vitest";
import { checkoutSchema } from "./checkout";

const validData = {
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  street: "123 Main St",
  city: "Melbourne",
  state: "VIC",
  zipcode: "3000",
  country: "Australia",
  phone: "+61412345678",
};

describe("checkoutSchema", () => {
  it("accepts valid address data", () => {
    const result = checkoutSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("accepts phone without country code", () => {
    const result = checkoutSchema.safeParse({
      ...validData,
      phone: "0412345678",
    });
    expect(result.success).toBe(true);
  });

  it("accepts phone with spaces and dashes", () => {
    const result = checkoutSchema.safeParse({
      ...validData,
      phone: "+61 412-345-678",
    });
    expect(result.success).toBe(true);
  });

  it("accepts 4-digit zipcode (Australia)", () => {
    const result = checkoutSchema.safeParse({
      ...validData,
      zipcode: "3000",
    });
    expect(result.success).toBe(true);
  });

  it("accepts 5-digit zipcode (US)", () => {
    const result = checkoutSchema.safeParse({
      ...validData,
      zipcode: "90210",
    });
    expect(result.success).toBe(true);
  });

  // --- Required field tests ---
  it.each([
    "firstName",
    "lastName",
    "email",
    "street",
    "city",
    "state",
    "zipcode",
    "country",
    "phone",
  ] as const)("rejects empty %s", (field) => {
    const result = checkoutSchema.safeParse({ ...validData, [field]: "" });
    expect(result.success).toBe(false);
  });

  it.each([
    "firstName",
    "lastName",
    "email",
    "street",
    "city",
    "state",
    "zipcode",
    "country",
    "phone",
  ] as const)("rejects missing %s", (field) => {
    const data = { ...validData };
    delete (data as Record<string, unknown>)[field];
    const result = checkoutSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  // --- Format validation ---
  it("rejects invalid email format", () => {
    const result = checkoutSchema.safeParse({
      ...validData,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects zipcode with letters", () => {
    const result = checkoutSchema.safeParse({
      ...validData,
      zipcode: "ABC",
    });
    expect(result.success).toBe(false);
  });

  it("rejects zipcode with fewer than 4 digits", () => {
    const result = checkoutSchema.safeParse({
      ...validData,
      zipcode: "123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects phone with only letters", () => {
    const result = checkoutSchema.safeParse({
      ...validData,
      phone: "abcdefgh",
    });
    expect(result.success).toBe(false);
  });

  it("rejects phone shorter than 8 characters", () => {
    const result = checkoutSchema.safeParse({
      ...validData,
      phone: "1234567",
    });
    expect(result.success).toBe(false);
  });

  // --- Max length ---
  it("rejects firstName exceeding 50 characters", () => {
    const result = checkoutSchema.safeParse({
      ...validData,
      firstName: "A".repeat(51),
    });
    expect(result.success).toBe(false);
  });
});
