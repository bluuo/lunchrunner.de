import { describe, expect, it } from "vitest";
import {
  validateOptionsSelection,
  validateOptionsDefinition,
} from "../services/optionsValidation.js";

const definition = {
  groups: [
    {
      id: "sauce",
      label: "Sauce",
      type: "single",
      values: [
        { label: "Ketchup", priceDelta: 0 },
        { label: "BBQ", priceDelta: 0.2 },
      ],
    },
    {
      id: "extras",
      label: "Extras",
      type: "multi",
      values: [
        { label: "Cheese", priceDelta: 0.4 },
        { label: "Onions", priceDelta: 0.1 },
      ],
    },
  ],
};

describe("options validation", () => {
  it("accepts a valid definition", () => {
    expect(() => validateOptionsDefinition(definition)).not.toThrow();
  });

  it("throws for an invalid selection", () => {
    expect(() =>
      validateOptionsSelection(definition, {
        sauce: "Mayo",
      })
    ).toThrow();
  });

  it("accepts a valid selection", () => {
    expect(() =>
      validateOptionsSelection(definition, {
        sauce: "BBQ",
        extras: ["Cheese"],
      })
    ).not.toThrow();
  });
});
