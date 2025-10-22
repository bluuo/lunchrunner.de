import { formatPriceAmount, validateOptions } from "./util.js";

const apiBaseUrl = window.location.origin.replace(/\/$/, "") + "/api";
const socket = io("/realtime", { path: "/socket.io" });

const authenticationFeedbackElement = document.querySelector("#authenticationFeedback");
const signedOutActionsElement = document.querySelector("#signedOutActions");
const signedInActionsElement = document.querySelector("#signedInActions");
const adminUserNameElement = document.querySelector("#adminUserName");
const clerkSignInContainer = document.querySelector("#clerkSignIn");
const clerkUserButtonContainer = document.querySelector("#clerkUserButton");
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
let hasAdminAccess = false;
let clerkConfig = null;
let clerkInitialized = false;
let signInMounted = false;
let userButtonMounted = false;
let unsubscribeClerkListener = null;
let clerkInitializationError = false;

function setAuthenticationFeedback(message, state = "info") {
  if (!authenticationFeedbackElement) {
    return;
  }
  authenticationFeedbackElement.textContent = message;
  authenticationFeedbackElement.dataset.state = state;
}

function updateAuthenticationFeedback() {
  if (clerkInitializationError) {
    return;
  }
  if (!clerkInitialized) {
    setAuthenticationFeedback("Loading authentication...", "info");
    return;
  }

  const session = window.Clerk?.session ?? null;
  if (!session) {
    setAuthenticationFeedback("Sign in with your Clerk administrator account to manage products.", "info");
    return;
  }

  if (hasAdminAccess) {
    setAuthenticationFeedback("Administrator privileges confirmed. You can manage products.", "success");
  } else {
    setAuthenticationFeedback("Signed-in account lacks administrator permissions.", "warning");
  }
}

function setSignedInUiState(isSignedIn) {
  if (signedInActionsElement) {
    signedInActionsElement.hidden = !isSignedIn;
  }
  if (signedOutActionsElement) {
    signedOutActionsElement.hidden = isSignedIn;
  }
}

function mountSignIn() {
  if (!window.Clerk || !clerkSignInContainer || signInMounted) {
    return;
  }
  const options = {
    afterSignInUrl: window.location.href,
    afterSignUpUrl: window.location.href,
  };
  if (clerkConfig?.signInUrl) {
    options.signInUrl = clerkConfig.signInUrl;
  }
  if (clerkConfig?.signUpUrl) {
    options.signUpUrl = clerkConfig.signUpUrl;
  }
  window.Clerk.mountSignIn(clerkSignInContainer, options);
  signInMounted = true;
}

function unmountSignIn() {
  if (!window.Clerk || !clerkSignInContainer || !signInMounted) {
    return;
  }
  if (typeof window.Clerk.unmountSignIn === "function") {
    window.Clerk.unmountSignIn(clerkSignInContainer);
  } else {
    clerkSignInContainer.innerHTML = "";
  }
  signInMounted = false;
}

function mountUserButton() {
  if (!window.Clerk || !clerkUserButtonContainer || userButtonMounted) {
    return;
  }
  window.Clerk.mountUserButton(clerkUserButtonContainer, {
    afterSignOutUrl: window.location.href,
  });
  userButtonMounted = true;
}

function unmountUserButton() {
  if (!window.Clerk || !clerkUserButtonContainer || !userButtonMounted) {
    return;
  }
  if (typeof window.Clerk.unmountUserButton === "function") {
    window.Clerk.unmountUserButton(clerkUserButtonContainer);
  } else {
    clerkUserButtonContainer.innerHTML = "";
  }
  userButtonMounted = false;
}

async function fetchClerkConfiguration() {
  const response = await fetch(`${apiBaseUrl}/auth/clerk-public-config`);
  if (!response.ok) {
    throw new Error("Failed to load Clerk configuration");
  }
  return response.json();
}

function loadClerkScript(publishableKey) {
  if (window.Clerk) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@clerk/clerk-js@latest/dist/clerk.browser.js";
    script.crossOrigin = "anonymous";
    script.setAttribute("data-clerk-publishable-key", publishableKey);
    script.addEventListener("load", () => {
      if (window.Clerk) {
        resolve();
      } else {
        reject(new Error("Clerk script did not initialize"));
      }
    });
    script.addEventListener("error", () => reject(new Error("Failed to load Clerk script")));
    document.head.appendChild(script);
  });
}

function updateAdminUserName() {
  if (!adminUserNameElement) {
    return;
  }
  const user = window.Clerk?.user;
  if (!user) {
    adminUserNameElement.textContent = "";
    return;
  }
  const primaryEmail = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses?.[0]?.emailAddress;
  adminUserNameElement.textContent = user.fullName || primaryEmail || user.username || user.id;
}

function updateEditorAvailability() {
  newProductButton.disabled = !hasAdminAccess;
  if (!hasAdminAccess) {
    productEditorSection.hidden = true;
  }
  updateAuthenticationFeedback();
}

function closeEditor() {
  productEditorSection.hidden = true;
}

function openCreateEditor() {
  productEditorTitle.textContent = "Create new product";
  productForm.reset();
  productIdInput.value = "";
  optionsDefinitionTextarea.value = JSON.stringify({ groups: [] }, null, 2);
  productEditorSection.hidden = false;
}

function populateEditor(product) {
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

function renderProducts() {
  productsListElement.innerHTML = "";
  if (productsCache.length === 0) {
    const emptyState = document.createElement("p");
    emptyState.classList.add("muted");
    emptyState.textContent = "No products available.";
    productsListElement.append(emptyState);
    return;
  }

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

    card.append(header, description, status, options);

    if (hasAdminAccess) {
      const actions = document.createElement("div");
      actions.classList.add("order-actions");

      const editButton = document.createElement("button");
      editButton.classList.add("secondary");
      editButton.textContent = "Edit";
      editButton.addEventListener("click", () => populateEditor(product));

      const deleteButton = document.createElement("button");
      deleteButton.classList.add("secondary");
      deleteButton.textContent = "Delete";
      deleteButton.addEventListener("click", () => deleteProduct(product.id));

      actions.append(editButton, deleteButton);
      card.append(actions);
    }

    productsListElement.append(card);
  }
}

async function getAuthorizationHeaders() {
  const session = window.Clerk?.session;
  if (!session) {
    throw new Error("No active Clerk session");
  }
  const options = {};
  if (clerkConfig?.jwtTemplate) {
    options.template = clerkConfig.jwtTemplate;
  }
  const token = await session.getToken(options);
  if (!token) {
    throw new Error("Failed to obtain Clerk session token");
  }
  return {
    Authorization: `Bearer ${token}`,
  };
}

async function loadProducts() {
  try {
    let response;
    const session = clerkInitialized ? window.Clerk?.session : null;
    hasAdminAccess = false;

    if (session) {
      try {
        const headers = await getAuthorizationHeaders();
        response = await fetch(`${apiBaseUrl}/admin/products`, { headers });
        if (response.ok) {
          hasAdminAccess = true;
        } else if (response.status === 403) {
          setAuthenticationFeedback("Signed-in account lacks administrator permissions.", "warning");
          response = await fetch(`${apiBaseUrl}/products`);
        } else if (response.status === 401) {
          setAuthenticationFeedback("Session expired. Please sign in again.", "warning");
          await window.Clerk.signOut();
          updateAdminUserName();
          updateEditorAvailability();
          return;
        } else {
          throw new Error(`Unexpected response: ${response.status}`);
        }
      } catch (error) {
        console.error("Admin product fetch failed", error);
        response = await fetch(`${apiBaseUrl}/products`);
      }
    } else {
      response = await fetch(`${apiBaseUrl}/products`);
    }

    if (!response.ok) {
      throw new Error(`Failed to load products (${response.status})`);
    }

    productsCache = await response.json();
    renderProducts();
    updateAdminUserName();
    updateEditorAvailability();
  } catch (error) {
    console.error("Loading products failed", error);
    setAuthenticationFeedback("Failed to load products. Please refresh the page.", "error");
  }
}

async function deleteProduct(productId) {
  if (!hasAdminAccess) {
    updateAuthenticationFeedback();
    return;
  }
  const confirmed = confirm("Delete this product?");
  if (!confirmed) {
    return;
  }
  try {
    const headers = await getAuthorizationHeaders();
    const response = await fetch(`${apiBaseUrl}/admin/products/${productId}`, {
      method: "DELETE",
      headers,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Unknown error" }));
      alert(`Deletion failed: ${error.message}`);
    }
  } catch (error) {
    console.error("Deleting product failed", error);
    alert("Deleting product failed. Please try again after signing in again.");
  }
}

async function bootstrapAuthentication() {
  try {
    clerkConfig = await fetchClerkConfiguration();
    await loadClerkScript(clerkConfig.publishableKey);
    await window.Clerk.load({ publishableKey: clerkConfig.publishableKey });
    clerkInitialized = true;
    setSignedInUiState(Boolean(window.Clerk.session));
    updateAdminUserName();
    updateAuthenticationFeedback();
    if (typeof window.Clerk.addListener === "function") {
      unsubscribeClerkListener = window.Clerk.addListener(async () => {
        setSignedInUiState(Boolean(window.Clerk.session));
        updateAdminUserName();
        if (window.Clerk.session) {
          unmountSignIn();
          mountUserButton();
        } else {
          mountSignIn();
          unmountUserButton();
        }
        updateEditorAvailability();
        await loadProducts();
      });
    }
    if (window.Clerk.session) {
      unmountSignIn();
      mountUserButton();
    } else {
      mountSignIn();
      unmountUserButton();
    }
  } catch (error) {
    console.error("Clerk initialization failed", error);
    clerkInitializationError = true;
    setAuthenticationFeedback("Authentication could not be initialized. Check the Clerk configuration.", "error");
  }
}

function initializeSocketListeners() {
  socket.on("productsUpdated", () => {
    loadProducts();
  });
}

newProductButton.addEventListener("click", () => {
  if (!hasAdminAccess) {
    updateAuthenticationFeedback();
    return;
  }
  openCreateEditor();
});

cancelButton.addEventListener("click", () => {
  closeEditor();
});

productForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!hasAdminAccess) {
    updateAuthenticationFeedback();
    return;
  }

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

  try {
    const headers = await getAuthorizationHeaders();
    headers["Content-Type"] = "application/json";
    const response = await fetch(`${apiBaseUrl}/admin/products`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Unknown error" }));
      alert(`Saving failed: ${error.message}`);
      return;
    }
    closeEditor();
  } catch (error) {
    console.error("Saving product failed", error);
    alert("Saving failed. Please make sure you are signed in and try again.");
  }
});

window.addEventListener("beforeunload", () => {
  if (typeof unsubscribeClerkListener === "function") {
    unsubscribeClerkListener();
  }
});

(async function init() {
  setAuthenticationFeedback("Loading authentication...", "info");
  await bootstrapAuthentication();
  initializeSocketListeners();
  await loadProducts();
})();
