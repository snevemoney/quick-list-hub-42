import { describe, expect, it } from "vitest";
import {
  centsToDollarString,
  dollarsToCents,
  formatListingPrice,
  parseDollarInputToCents,
} from "./money";

describe("money", () => {
  it("parses dollar input to integer cents", () => {
    expect(parseDollarInputToCents("45")).toBe(4500);
    expect(parseDollarInputToCents("45.5")).toBe(4550);
    expect(parseDollarInputToCents("45.50")).toBe(4550);
    expect(parseDollarInputToCents("0.01")).toBe(1);
    expect(parseDollarInputToCents("not-a-price")).toBeNull();
    expect(parseDollarInputToCents("45.999")).toBeNull();
  });

  it("converts dollar numerics without float leftovers", () => {
    expect(dollarsToCents(45)).toBe(4500);
    expect(dollarsToCents("19.99")).toBe(1999);
    expect(centsToDollarString(1999)).toBe("19.99");
    expect(centsToDollarString(500)).toBe("5.00");
  });

  it("formats listing prices as whole dollars", () => {
    expect(formatListingPrice(45)).toBe("$45");
    expect(formatListingPrice(19.99)).toBe("$19");
  });
});
