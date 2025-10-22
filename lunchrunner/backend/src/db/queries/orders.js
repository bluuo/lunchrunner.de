import { v4 as generateUuid } from "uuid";
const tableName = "orders";

function jsonbArrayLiteral(knex, items) {
  const placeholders = items.map(() => "?").join(",");
  const values = items.map((item) => JSON.stringify(item));
  return knex.raw(`ARRAY[${placeholders}]::jsonb[]`, values);
}

function parseItems(row) {
  if (row.items_json) {
    return row.items_json;
  }
  const value = row.items;
  if (!value) {
    return [];
  }
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (error) {
      return [];
    }
  }
  if (Array.isArray(value)) {
    return value.map((entry) => {
      if (typeof entry === "string") {
        try {
          return JSON.parse(entry);
        } catch (error) {
          return entry;
        }
      }
      return entry;
    });
  }
  return [];
}

export function mapOrderRow(row) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    deviceId: row.device_id,
    customerName: row.customer_name,
    items: parseItems(row),
    totalPriceGross: Number(row.total_price_gross),
    currencyCode: row.currency_code,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createOrderRepository(knex) {
  async function findAll() {
    const rows = await knex
      .select(
        "id",
        "device_id",
        "customer_name",
        "items",
        knex.raw("array_to_json(items) as items_json"),
        "total_price_gross",
        "currency_code",
        "created_at",
        "updated_at"
      )
      .from(tableName)
      .orderBy("created_at", "asc");
    return rows.map(mapOrderRow);
  }

  async function saveOrder(order) {
    const now = knex.fn.now();
    const itemsArray = jsonbArrayLiteral(knex, order.items);
    if (order.id) {
      await knex(tableName)
        .where({ id: order.id })
        .update({
          device_id: order.deviceId,
          customer_name: order.customerName,
          items: itemsArray,
          total_price_gross: order.totalPriceGross,
          currency_code: order.currencyCode,
          updated_at: now,
        });
      return findById(order.id);
    }
    const orderId = order.id ?? generateUuid();
    await knex(tableName).insert({
      id: orderId,
      device_id: order.deviceId,
      customer_name: order.customerName,
      items: itemsArray,
      total_price_gross: order.totalPriceGross,
      currency_code: order.currencyCode,
      created_at: now,
      updated_at: now,
    });
    return findById(orderId);
  }

  async function findById(id) {
    const row = await knex
      .select(
        "id",
        "device_id",
        "customer_name",
        "items",
        knex.raw("array_to_json(items) as items_json"),
        "total_price_gross",
        "currency_code",
        "created_at",
        "updated_at"
      )
      .from(tableName)
      .where({ id })
      .first();
    return mapOrderRow(row);
  }

  async function remove(id) {
    await knex(tableName).where({ id }).del();
  }

  return {
    findAll,
    saveOrder,
    findById,
    remove,
  };
}
