CREATE TABLE units (
  unit_id         TEXT PRIMARY KEY,
  community_id    TEXT NOT NULL,
  unit_name       TEXT NOT NULL,
  sqft            INTEGER NOT NULL,
  floor_plan      TEXT,
  finish_package  TEXT,
  floor_number    TEXT,
  first_seen      TEXT NOT NULL,
  last_seen       TEXT NOT NULL
);

CREATE TABLE unit_prices (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  scraped_at      TEXT NOT NULL,
  move_in_date    TEXT NOT NULL,
  unit_id         TEXT NOT NULL REFERENCES units(unit_id),
  lease_term      INTEGER,
  price           INTEGER NOT NULL,
  total_price     INTEGER NOT NULL,
  net_effective   INTEGER NOT NULL,
  furnished_price INTEGER,
  UNIQUE(scraped_at, move_in_date, unit_id)
);

CREATE INDEX idx_prices_scraped ON unit_prices(scraped_at);
CREATE INDEX idx_prices_unit ON unit_prices(unit_id, scraped_at);
