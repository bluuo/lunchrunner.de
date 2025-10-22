import knexModule from "knex";
import { v4 as generateUuid } from "uuid";
import { config } from "../config.js";

const knex = knexModule({
  client: "pg",
  connection: config.databaseUrl,
});

const sampleProducts = [
  {
    product_name: "Veggie Wrap",
    product_description: "Fresh wrap with vegetables and hummus",
    product_price_gross: 5.5,
    product_category: "Wraps",
    options_definition: {
      groups: [
        {
          id: "sauce",
          label: "Sauce",
          type: "single",
          values: [
            { label: "Yogurt Sauce", priceDelta: 0 },
            { label: "BBQ", priceDelta: 0.2 },
          ],
        },
        {
          id: "extras",
          label: "Extras",
          type: "multi",
          values: [
            { label: "Feta", priceDelta: 0.5 },
            { label: "Olives", priceDelta: 0.4 },
          ],
        },
      ],
    },
  },
  {
    product_name: "Meatball Sandwich",
    product_description: "Homemade meatball in a bun",
    product_price_gross: 3.2,
    product_category: "Snacks",
    options_definition: {
      groups: [
        {
          id: "sauce",
          label: "Sauce",
          type: "single",
          values: [
            { label: "Ketchup", priceDelta: 0 },
            { label: "Mustard", priceDelta: 0 },
          ],
        },
        {
          id: "extras",
          label: "Extras",
          type: "multi",
          values: [
            { label: "Onions", priceDelta: 0.1 },
            { label: "Cheese", priceDelta: 0.4 },
          ],
        },
      ],
    },
  },
  {
    product_name: "Summer Salad",
    product_description: "Colorful salad with seasonal vegetables",
    product_price_gross: 6.9,
    product_category: "Salads",
    options_definition: {
      groups: [
        {
          id: "dressing",
          label: "Dressing",
          type: "single",
          values: [
            { label: "Balsamic", priceDelta: 0 },
            { label: "Yogurt", priceDelta: 0 },
          ],
        },
        {
          id: "toppings",
          label: "Toppings",
          type: "multi",
          values: [
            { label: "Croutons", priceDelta: 0.3 },
            { label: "Sunflower Seeds", priceDelta: 0.2 },
          ],
        },
      ],
    },
  },
];

async function seed() {
  for (const product of sampleProducts) {
    const existing = await knex("products").where({ product_name: product.product_name }).first();
    if (existing) {
      await knex("products")
        .where({ id: existing.id })
        .update({
          ...product,
          updated_at: knex.fn.now(),
        });
    } else {
      await knex("products").insert({ id: generateUuid(), ...product });
    }
  }
}

seed()
  .then(() => {
    console.log("Seed data written");
  })
  .catch((error) => {
    console.error("Seed failed", error);
    process.exitCode = 1;
  })
  .finally(() => knex.destroy());
