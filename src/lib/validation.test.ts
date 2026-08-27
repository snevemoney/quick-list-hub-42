import { describe, expect, it } from "vitest";
import { authSchema, isUuid, listingFormSchema, messageSchema, sanitizeSearch } from "./validation";

describe("validation", () => {
  it("accepts a valid listing form", () => {
    const parsed = listingFormSchema.safeParse({
      title: "Chair",
      description: "A chair",
      price: "12.50",
      category: "Furniture",
      city: "Austin",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid email and empty messages", () => {
    expect(authSchema.safeParse({ email: "nope", password: "abcdef" }).success).toBe(false);
    expect(messageSchema.safeParse("").success).toBe(false);
    expect(messageSchema.safeParse("hello").success).toBe(true);
  });

  it("checks uuids and sanitizes search", () => {
    expect(isUuid("3fa85f64-5717-4562-b3fc-2c963f66afa6")).toBe(true);
    expect(isUuid("not-a-uuid")).toBe(false);
    expect(sanitizeSearch("bike%_foo")).toBe("bikefoo");
  });
});
