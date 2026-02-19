import { describe, expect, it } from "vitest";

import {
  EN_TRANSLATIONS,
  LANGUAGE_OPTIONS,
  isLanguage,
  translate,
} from "../src/i18n/translations";

describe("i18n translations helpers", () => {
  it("validates supported language codes", () => {
    expect(isLanguage("en")).toBe(true);
    expect(isLanguage("hi")).toBe(true);
    expect(isLanguage("mr")).toBe(true);
    expect(isLanguage("xx")).toBe(false);
    expect(isLanguage("")).toBe(false);
  });

  it("exposes all language options in selector", () => {
    const languages = LANGUAGE_OPTIONS.map((option) => option.language);
    expect(languages).toEqual(["en", "hi", "mr"]);
  });

  it("returns translated values for Hindi and Marathi", () => {
    expect(translate("hi", "common.ok")).toBe("ठीक है");
    expect(translate("mr", "common.ok")).toBe("ठीक आहे");
    expect(translate("mr", "auth.login.signIn")).toBe("साइन इन");
  });

  it("interpolates message parameters in localized strings", () => {
    const message = translate("en", "import.popup.otherAgentFileMessage", {
      registeredAgentCode: "001",
      registeredSocietyCode: "SOC001",
      selectedAgentCode: "002",
      selectedSocietyCode: "SOC002",
    });

    expect(message).toContain("001");
    expect(message).toContain("SOC001");
    expect(message).toContain("002");
    expect(message).toContain("SOC002");
    expect(message).not.toContain("{{registeredAgentCode}}");
  });

  it("falls back to key when an unknown key is requested", () => {
    const unknownKey = "does.not.exist" as keyof typeof EN_TRANSLATIONS;
    expect(translate("en", unknownKey)).toBe("does.not.exist");
  });
});
