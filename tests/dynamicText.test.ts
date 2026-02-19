import { describe, expect, it } from "vitest";

import { localizeClientName } from "../src/i18n/nameLocalization";

describe("dynamic client-name localization", () => {
  it("keeps English names unchanged in English mode", () => {
    expect(localizeClientName("RAMESH KUMAR", "en")).toBe("RAMESH KUMAR");
  });

  it("transliterates Latin names to Devanagari in Hindi mode", () => {
    const converted = localizeClientName("RAMESH KUMAR", "hi");
    expect(converted).not.toBe("RAMESH KUMAR");
    expect(converted).toMatch(/[\u0900-\u097F]/);
  });

  it("transliterates Latin names to Devanagari in Marathi mode", () => {
    const converted = localizeClientName("SURESH PATIL", "mr");
    expect(converted).not.toBe("SURESH PATIL");
    expect(converted).toMatch(/[\u0900-\u097F]/);
  });

  it("does not alter already-Devanagari names", () => {
    const name = "सुरेश पाटील";
    expect(localizeClientName(name, "hi")).toBe(name);
    expect(localizeClientName(name, "mr")).toBe(name);
  });

  it("handles large batches of dynamic names", () => {
    const names = Array.from({ length: 1500 }, (_, index) => `CLIENT ${index + 1}`);
    const converted = names.map((name) => localizeClientName(name, "hi"));
    expect(converted).toHaveLength(1500);
    expect(converted[0]).toMatch(/[\u0900-\u097F]/);
    expect(converted[1499]).toMatch(/[\u0900-\u097F]/);
  });
});
