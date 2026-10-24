// Barebones smoke test, not a full suite
import { describe, expect, it } from "bun:test";
import uwork from "./uwork.js";

describe("uwork", () => {
  it("runs a function in a worker", async () => {
    expect(await uwork((n) => n * 2)(5)).toBe(10);
  });
});
