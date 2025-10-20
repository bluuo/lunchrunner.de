CREATE TABLE IF NOT EXISTS produkte (
  id UUID PRIMARY KEY,
  produkt_name TEXT NOT NULL,
  produkt_beschreibung TEXT,
  produkt_preis_brutto NUMERIC(10, 2) NOT NULL,
  waehrung_code VARCHAR(3) NOT NULL DEFAULT 'EUR',
  produkt_kategorie TEXT,
  produkt_aktiv BOOLEAN NOT NULL DEFAULT TRUE,
  optionen_definition JSONB NOT NULL,
  erstellt_am TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  aktualisiert_am TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bestellungen (
  id UUID PRIMARY KEY,
  geraete_id UUID NOT NULL,
  nutzer_name TEXT NOT NULL,
  positionen JSONB[] NOT NULL,
  gesamt_preis_brutto NUMERIC(10, 2) NOT NULL,
  waehrung_code VARCHAR(3) NOT NULL DEFAULT 'EUR',
  erstellt_am TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  aktualisiert_am TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bestellungen_geraete_id ON bestellungen (geraete_id);
