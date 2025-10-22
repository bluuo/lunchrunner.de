CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY,
    product_name TEXT NOT NULL,
    product_description TEXT,
    product_price_gross NUMERIC(10,2) NOT NULL,
    currency_code VARCHAR(3) NOT NULL DEFAULT 'EUR',
    product_category TEXT,
    product_active BOOLEAN NOT NULL DEFAULT TRUE,
    options_definition JSONB NOT NULL DEFAULT '{"groups":[]}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY,
    device_id UUID NOT NULL,
    customer_name TEXT NOT NULL,
    items JSONB NOT NULL,
    total_price_gross NUMERIC(10,2) NOT NULL,
    currency_code VARCHAR(3) NOT NULL DEFAULT 'EUR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_active ON products(product_active);
CREATE INDEX IF NOT EXISTS idx_orders_device_id ON orders(device_id);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_products_updated ON products;
CREATE TRIGGER trigger_products_updated
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trigger_orders_updated ON orders;
CREATE TRIGGER trigger_orders_updated
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
