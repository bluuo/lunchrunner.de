import { v4 as generateUuid } from "uuid";
const tableName = "products";

export function mapProductRow(row) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    productName: row.product_name,
    productDescription: row.product_description,
    productPriceGross: Number(row.product_price_gross),
    currencyCode: row.currency_code,
    productCategory: row.product_category,
    productActive: row.product_active,
    optionsDefinition: row.options_definition,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createProductRepository(knex) {
  async function findAllActive() {
    const rows = await knex(tableName)
      .where({ product_active: true })
      .orderBy("product_name", "asc");
    return rows.map(mapProductRow);
  }

  async function findAll() {
    const rows = await knex(tableName).orderBy("product_name", "asc");
    return rows.map(mapProductRow);
  }

  async function saveProduct(product) {
    const now = knex.fn.now();
    if (product.id) {
      const row = {
        product_name: product.productName,
        product_description: product.productDescription,
        product_price_gross: product.productPriceGross,
        currency_code: product.currencyCode ?? "EUR",
        product_category: product.productCategory,
        product_active: product.productActive,
        options_definition: product.optionsDefinition,
        updated_at: now,
      };
      await knex(tableName).where({ id: product.id }).update(row);
      const updated = await knex(tableName).where({ id: product.id }).first();
      return mapProductRow(updated);
    }
    const productId = product.id ?? generateUuid();
    const [created] = await knex(tableName)
      .insert({
        id: productId,
        product_name: product.productName,
        product_description: product.productDescription,
        product_price_gross: product.productPriceGross,
        currency_code: product.currencyCode ?? "EUR",
        product_category: product.productCategory,
        product_active: product.productActive ?? true,
        options_definition: product.optionsDefinition,
        created_at: now,
        updated_at: now,
      })
      .returning("*");
    return mapProductRow(created);
  }

  async function findById(id) {
    const row = await knex(tableName).where({ id }).first();
    return mapProductRow(row);
  }

  async function deleteProduct(id) {
    await knex(tableName).where({ id }).del();
  }

  return {
    findAllActive,
    findAll,
    saveProduct,
    findById,
    deleteProduct,
  };
}
