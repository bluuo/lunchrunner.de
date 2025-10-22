import { validateOptionsSelection } from "./optionsValidation.js";

export function calculateOrder({ products, items, currencyCode }) {
  let totalPrice = 0;
  const itemsWithSnapshot = [];
  for (const item of items) {
    const product = products.find((entry) => entry.id === item.productId);
    if (!product) {
      const error = new Error("Product not found");
      error.status = 404;
      throw error;
    }
    validateOptionsSelection(product.optionsDefinition, item.selectedOptions || {});
    const optionsPrice = calculateOptionsPrice(product, item.selectedOptions || {});
    const basePrice = Number(product.productPriceGross);
    const quantity = Number(item.quantity ?? 1);
    const itemPrice = (basePrice + optionsPrice) * quantity;
    totalPrice += itemPrice;
    itemsWithSnapshot.push({
      productId: product.id,
      productNameSnapshot: product.productName,
      productBasePriceSnapshot: basePrice,
      currencyCode: product.currencyCode,
      quantity,
      selectedOptions: item.selectedOptions || {},
      optionsPriceTotalSnapshot: Number(optionsPrice.toFixed(2)),
      itemPriceGrossSnapshot: Number(itemPrice.toFixed(2)),
    });
  }
  return {
    items: itemsWithSnapshot,
    totalPriceGross: Number(totalPrice.toFixed(2)),
    currencyCode,
  };
}

function calculateOptionsPrice(product, selectedOptions) {
  let sum = 0;
  for (const group of product.optionsDefinition.groups ?? []) {
    const selection = selectedOptions?.[group.id];
    if (!selection) {
      continue;
    }
    if (group.type === "single") {
      const option = group.values.find((value) => value.label === selection);
      if (option) {
        sum += Number(option.priceDelta);
      }
    } else if (group.type === "multi") {
      for (const entry of selection) {
        const option = group.values.find((value) => value.label === entry);
        if (option) {
          sum += Number(option.priceDelta);
        }
      }
    }
  }
  return sum;
}
