import { describe, expect, it } from "vitest";
import { calculateOrder } from "../services/priceCalculation.js";

const product = {
  id: "11111111-1111-1111-1111-111111111111",
  productName: "Test Product",
  productPriceGross: 5,
  currencyCode: "EUR",
  optionsDefinition: {
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
  },
};

describe("calculateOrder", () => {
  it("calculates item and total prices correctly", () => {
    const result = calculateOrder({
      products: [product],
      items: [
        {
          productId: product.id,
          quantity: 2,
          selectedOptions: {
            sauce: "BBQ",
            extras: ["Cheese", "Onions"],
          },
        },
      ],
      currencyCode: "EUR",
    });
    expect(result.totalPriceGross).toBeCloseTo(11.4, 2);
    expect(result.items[0].optionsPriceTotalSnapshot).toBeCloseTo(0.7, 2);
    expect(result.items[0].itemPriceGrossSnapshot).toBeCloseTo(11.4, 2);
  });
});
