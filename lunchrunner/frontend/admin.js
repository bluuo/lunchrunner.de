import {
  formatPriceAmount,
  readAdminToken,
  storeAdminToken,
  validateOptions,
} from "./util.js";

const apiBaseUrl = window.location.origin.replace(/\/$/, "") + "/api";
const socket = io("/realtime", { path: "/socket.io" });

const adminTokenForm = document.querySelector("#adminTokenForm");
const adminTokenInput = document.querySelector("#adminTokenInput");
const productsListElement = document.querySelector("#productsList");
const newProductButton = document.querySelector("#newProductButton");
const productEditorSection = document.querySelector("#productEditorSection");
const productEditorTitle = document.querySelector("#productEditorTitle");
const productForm = document.querySelector("#productForm");
const productIdInput = document.querySelector("#productId");
const productNameInput = document.querySelector("#productName");
const productDescriptionInput = document.querySelector("#productDescription");
const productPriceInput = document.querySelector("#productPrice");
const productCategoryInput = document.querySelector("#productCategory");
const productActiveSelect = document.querySelector("#productActive");
const optionsDefinitionTextarea = document.querySelector("#optionsDefinition");
const cancelButton = document.querySelector("#cancelButton");

let productsCache = [];
let adminToken = readAdminToken();
adminTokenInput.value = adminToken;

adminTokenForm.addEventListener("submit", (event) => {
  event.preventDefault();
  adminToken = adminTokenInput.value.trim();
  storeAdminToken(adminToken);
  alert("Token saved");
  loadProducts();
});

newProductButton.addEventListener("click", () => {
  productEditorTitle.textContent = "Create new product";
  productForm.reset();
  productIdInput.value = "";
  optionsDefinitionTextarea.value = JSON.stringify(
    {
      groups: [],
    },
    null,
    2
  );
  productEditorSection.hidden = false;
});

cancelButton.addEventListener("click", () => {
  productEditorSection.hidden = true;
});

productForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  let optionsDefinition;
  try {
    optionsDefinition = JSON.parse(optionsDefinitionTextarea.value);
  } catch (error) {
    alert("Options definition must be valid JSON");
    return;
  }
  if (!validateOptions(optionsDefinition, {})) {
    alert("Options definition does not match the schema");
    return;
  }
  const payload = {
    id: productIdInput.value || undefined,
    productName: productNameInput.value.trim(),
    productDescription: productDescriptionInput.value.trim(),
    productPriceGross: Number(productPriceInput.value),
    productCategory: productCategoryInput.value.trim(),
    productActive: productActiveSelect.value === "true",
    optionsDefinition,
  };
  const response = await fetch(`${apiBaseUrl}/admin/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": adminToken,
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Unknown error" }));
    alert(`Saving failed: ${error.message}`);
    return;
  }
  productEditorSection.hidden = true;
});

function renderProducts() {
  productsListElement.innerHTML = "";
  for (const product of productsCache) {
    const card = document.createElement("article");
    card.classList.add("product-card");

    const header = document.createElement("header");
    const title = document.createElement("h3");
    title.textContent = product.productName;
    const price = document.createElement("span");
    price.textContent = formatPriceAmount(product.productPriceGross, product.currencyCode);
    header.append(title, price);

    const description = document.createElement("p");
    description.textContent = product.productDescription ?? "No description";

    const status = document.createElement("p");
    status.innerHTML = `<strong>Status:</strong> ${product.productActive ? "Active" : "Inactive"}`;

    const options = document.createElement("pre");
    options.textContent = JSON.stringify(product.optionsDefinition, null, 2);

    const actions = document.createElement("div");
    actions.classList.add("order-actions");

    const editButton = document.createElement("button");
    editButton.classList.add("secondary");
    editButton.textContent = "Edit";
    editButton.addEventListener("click", () => editProduct(product));

    const deleteButton = document.createElement("button");
    deleteButton.classList.add("secondary");
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => deleteProduct(product.id));

    actions.append(editButton, deleteButton);

    card.append(header, description, status, options, actions);
    productsListElement.append(card);
  }
}

async function deleteProduct(productId) {
  const confirmed = confirm("Delete this product?");
  if (!confirmed) {
    return;
  }
  const response = await fetch(`${apiBaseUrl}/admin/products/${productId}`, {
    method: "DELETE",
    headers: {
      "x-admin-token": adminToken,
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Unknown error" }));
    alert(`Deletion failed: ${error.message}`);
  }
}

function editProduct(product) {
  productEditorTitle.textContent = "Edit product";
  productIdInput.value = product.id;
  productNameInput.value = product.productName;
  productDescriptionInput.value = product.productDescription ?? "";
  productPriceInput.value = product.productPriceGross;
  productCategoryInput.value = product.productCategory ?? "";
  productActiveSelect.value = product.productActive ? "true" : "false";
  optionsDefinitionTextarea.value = JSON.stringify(product.optionsDefinition, null, 2);
  productEditorSection.hidden = false;
}

socket.on("productsUpdated", () => {
  loadProducts();
});

async function loadProducts() {
  const headers = {};
  if (adminToken) {
    headers["x-admin-token"] = adminToken;
  }
  const response = await fetch(
    adminToken ? `${apiBaseUrl}/admin/products` : `${apiBaseUrl}/products`,
    {
      headers,
    }
  );
  if (!response.ok) {
    if (response.status === 401 && adminToken) {
      alert("Admin token invalid");
      productsCache = await (await fetch(`${apiBaseUrl}/products`)).json();
    } else {
      alert("Failed to load products");
      return;
    }
  } else {
    productsCache = await response.json();
  }
  renderProducts();
}

loadProducts();
