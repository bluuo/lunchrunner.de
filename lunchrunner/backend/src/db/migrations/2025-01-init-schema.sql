CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY,
  product_name TEXT NOT NULL,
  product_description TEXT,
  product_price_gross NUMERIC(10, 2) NOT NULL,
  currency_code VARCHAR(3) NOT NULL DEFAULT 'EUR',
  product_category TEXT,
  product_active BOOLEAN NOT NULL DEFAULT TRUE,
  options_definition JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY,
  device_id UUID NOT NULL,
  customer_name TEXT NOT NULL,
  items JSONB[] NOT NULL,
  total_price_gross NUMERIC(10, 2) NOT NULL,
  currency_code VARCHAR(3) NOT NULL DEFAULT 'EUR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_device_id ON orders (device_id);
