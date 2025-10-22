import { createOrReadDeviceId, formatPriceAmount, validateOptions } from "./util.js";

const apiBaseUrl = window.location.origin.replace(/\/$/, "") + "/api";
const socket = io("/realtime", { path: "/socket.io" });
const deviceId = createOrReadDeviceId();

const productSelectElement = document.querySelector("#productSelect");
const optionsContainerElement = document.querySelector("#optionsContainer");
const orderFormElement = document.querySelector("#orderForm");
const ordersListElement = document.querySelector("#ordersList");
const customerNameElement = document.querySelector("#customerName");
const productQuantityElement = document.querySelector("#productQuantity");

let productsCache = [];
let ordersCache = [];

async function loadProducts() {
  const response = await fetch(`${apiBaseUrl}/products`);
  if (!response.ok) {
    throw new Error("Failed to load products");
  }
  productsCache = await response.json();
  updateProductSelect();
}

async function loadOrders() {
  const response = await fetch(`${apiBaseUrl}/orders`);
  if (!response.ok) {
    throw new Error("Failed to load orders");
  }
  ordersCache = await response.json();
  renderOrders();
}

function updateProductSelect() {
  productSelectElement.innerHTML = "";
  for (const product of productsCache) {
    const option = document.createElement("option");
    option.value = product.id;
    option.textContent = `${product.productName} (${formatPriceAmount(
      product.productPriceGross,
      product.currencyCode
    )})`;
    productSelectElement.append(option);
  }
  buildOptionFields();
}

function buildOptionFields() {
  optionsContainerElement.innerHTML = "";
  const productId = productSelectElement.value;
  const product = productsCache.find((entry) => entry.id === productId);
  if (!product || !product.optionsDefinition) {
    optionsContainerElement.hidden = true;
    return;
  }
  optionsContainerElement.hidden = false;
  for (const group of product.optionsDefinition.groups ?? []) {
    const groupElement = document.createElement("div");
    groupElement.classList.add("options-group");

    const titleElement = document.createElement("h3");
    titleElement.textContent = group.label;
    groupElement.append(titleElement);

    const valuesContainer = document.createElement("div");
    valuesContainer.classList.add("options-values");

    if (group.type === "single") {
      const emptyOption = document.createElement("label");
      const emptyRadio = document.createElement("input");
      emptyRadio.type = "radio";
      emptyRadio.name = `option-${group.id}`;
      emptyRadio.value = "";
      emptyRadio.checked = true;
      emptyOption.append(emptyRadio, document.createTextNode("No selection"));
      valuesContainer.append(emptyOption);
    }

    for (const value of group.values) {
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.value = value.label;
      if (group.type === "single") {
        input.type = "radio";
        input.name = `option-${group.id}`;
      } else {
        input.type = "checkbox";
        input.name = `option-${group.id}`;
      }
      label.append(
        input,
        `${value.label} (${formatPriceAmount(value.priceDelta, product.currencyCode)})`
      );
      valuesContainer.append(label);
    }

    groupElement.append(valuesContainer);
    optionsContainerElement.append(groupElement);
  }
}

function readOptionsFromForm() {
  const productId = productSelectElement.value;
  const product = productsCache.find((entry) => entry.id === productId);
  if (!product || !product.optionsDefinition) {
    return {};
  }
  const selection = {};
  for (const group of product.optionsDefinition.groups ?? []) {
    const inputs = optionsContainerElement.querySelectorAll(`[name="option-${group.id}"]`);
    if (group.type === "single") {
      const chosen = Array.from(inputs).find((input) => input.checked);
      if (chosen && chosen.value) {
        selection[group.id] = chosen.value;
      }
    } else {
      const activeValues = Array.from(inputs)
        .filter((input) => input.checked)
        .map((input) => input.value);
      if (activeValues.length > 0) {
        selection[group.id] = activeValues;
      }
    }
  }
  return selection;
}

function renderOrders() {
  ordersListElement.innerHTML = "";
  for (const order of ordersCache) {
    const card = document.createElement("article");
    card.classList.add("order-card");

    const header = document.createElement("div");
    header.classList.add("order-header");
    const nameElement = document.createElement("h3");
    nameElement.textContent = order.customerName;
    const totalElement = document.createElement("span");
    totalElement.textContent = formatPriceAmount(order.totalPriceGross, order.currencyCode);
    header.append(nameElement, totalElement);

    const itemsList = document.createElement("ul");
    itemsList.classList.add("order-items");

    for (const item of order.items) {
      const listItem = document.createElement("li");
      const optionDetails = [];
      if (item.selectedOptions) {
        for (const [key, value] of Object.entries(item.selectedOptions)) {
          optionDetails.push(`${key}: ${Array.isArray(value) ? value.join(", ") : value}`);
        }
      }
      listItem.textContent = `${item.quantity} × ${item.productNameSnapshot} (${formatPriceAmount(
        item.itemPriceGrossSnapshot,
        item.currencyCode
      )})${optionDetails.length ? ` – ${optionDetails.join(" | ")}` : ""}`;
      itemsList.append(listItem);
    }

    card.append(header, itemsList);

    if (order.deviceId === deviceId) {
      const actions = document.createElement("div");
      actions.classList.add("order-actions");

      const editButton = document.createElement("button");
      editButton.classList.add("secondary");
      editButton.textContent = "Edit";
      editButton.addEventListener("click", () => editOrder(order));

      const deleteButton = document.createElement("button");
      deleteButton.classList.add("secondary");
      deleteButton.textContent = "Delete";
      deleteButton.addEventListener("click", () => deleteOrder(order.id));

      actions.append(editButton, deleteButton);
      card.append(actions);
    }

    ordersListElement.append(card);
  }
}

async function deleteOrder(orderId) {
  const confirmed = confirm("Delete this order?");
  if (!confirmed) {
    return;
  }
  const response = await fetch(`${apiBaseUrl}/orders/${orderId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "x-device-id": deviceId,
    },
  });
  if (!response.ok) {
    alert("Failed to delete order");
  }
}

function editOrder(order) {
  customerNameElement.value = order.customerName;
  const firstItem = order.items[0];
  if (!firstItem) {
    return;
  }
  productSelectElement.value = firstItem.productId;
  buildOptionFields();
  productQuantityElement.value = firstItem.quantity;
  for (const groupElement of optionsContainerElement.querySelectorAll(".options-group")) {
    const groupId = groupElement.querySelector("input")?.name.replace("option-", "");
    if (!groupId || !firstItem.selectedOptions) {
      continue;
    }
    const selectionValue = firstItem.selectedOptions[groupId];
    const inputs = groupElement.querySelectorAll("input");
    if (Array.isArray(selectionValue)) {
      for (const input of inputs) {
        input.checked = selectionValue.includes(input.value);
      }
    } else if (typeof selectionValue === "string") {
      for (const input of inputs) {
        input.checked = input.value === selectionValue;
      }
    }
  }
  orderFormElement.dataset.editOrderId = order.id;
}

orderFormElement.addEventListener("submit", async (event) => {
  event.preventDefault();
  const productId = productSelectElement.value;
  const product = productsCache.find((entry) => entry.id === productId);
  if (!product) {
    alert("Please select a product");
    return;
  }
  const optionsSelection = readOptionsFromForm();
  if (!validateOptions(product.optionsDefinition, optionsSelection)) {
    alert("Options are invalid");
    return;
  }
  const payload = {
    customerName: customerNameElement.value.trim(),
    items: [
      {
        productId,
        quantity: Number(productQuantityElement.value),
        selectedOptions: optionsSelection,
      },
    ],
  };
  const method = orderFormElement.dataset.editOrderId ? "PUT" : "POST";
  const url = orderFormElement.dataset.editOrderId
    ? `${apiBaseUrl}/orders/${orderFormElement.dataset.editOrderId}`
    : `${apiBaseUrl}/orders`;
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-device-id": deviceId,
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Unknown error" }));
    alert(`Failed to save: ${error.message}`);
    return;
  }
  orderFormElement.reset();
  delete orderFormElement.dataset.editOrderId;
  buildOptionFields();
});

productSelectElement.addEventListener("change", () => buildOptionFields());

socket.on("productsUpdated", (data) => {
  productsCache = data;
  updateProductSelect();
  renderOrders();
});

socket.on("ordersUpdated", (data) => {
  ordersCache = data;
  renderOrders();
});

Promise.all([loadProducts(), loadOrders()]).catch((error) => {
  console.error(error);
  alert("Failed to load initial data");
});
