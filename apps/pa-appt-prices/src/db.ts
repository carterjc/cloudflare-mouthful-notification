import type { AvalonUnit } from "./scraper";

export async function upsertUnits(
  db: D1Database,
  units: AvalonUnit[],
  today: string,
) {
  const stmt = db.prepare(`
    INSERT INTO units (unit_id, unit_name, sqft, floor_plan, finish_package, floor_number, first_seen, last_seen)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(unit_id) DO UPDATE SET last_seen = excluded.last_seen
  `);

  await db.batch(
    units.map((u) =>
      stmt.bind(
        u.unitId,
        u.unitName,
        u.squareFeet,
        u.floorPlan.name,
        u.finishPackage?.name ?? null,
        u.floorNumber,
        today,
        today,
      ),
    ),
  );
}

export async function insertPrices(
  db: D1Database,
  units: AvalonUnit[],
  scrapedAt: string,
  moveInDate: string,
) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO unit_prices
    (scraped_at, move_in_date, unit_id, lease_term, price, total_price, net_effective, furnished_price)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  await db.batch(
    units.map((u) =>
      stmt.bind(
        scrapedAt,
        moveInDate,
        u.unitId,
        u.startingAtPricesUnfurnished.leaseTerm,
        u.startingAtPricesUnfurnished.prices.price,
        u.startingAtPricesUnfurnished.prices.totalPrice,
        u.startingAtPricesUnfurnished.prices.netEffectivePrice,
        u.startingAtPricesFurnished?.prices.price ?? null,
      ),
    ),
  );
}

export async function queryUnits(db: D1Database) {
  return db
    .prepare(
      `SELECT unit_id, unit_name, sqft, floor_plan, finish_package, floor_number, first_seen, last_seen
       FROM units ORDER BY unit_name`,
    )
    .all();
}

export async function queryLatest(db: D1Database) {
  return db
    .prepare(
      `SELECT u.unit_name, u.sqft, u.floor_plan, u.finish_package,
              p.move_in_date, p.lease_term, p.price, p.total_price, p.net_effective, p.furnished_price
       FROM unit_prices p JOIN units u ON p.unit_id = u.unit_id
       WHERE p.scraped_at = (SELECT MAX(scraped_at) FROM unit_prices)
       ORDER BY p.move_in_date, p.price`,
    )
    .all();
}

export async function queryHistory(db: D1Database, unitId: string) {
  return db
    .prepare(
      `SELECT p.scraped_at, p.move_in_date, p.lease_term, p.price, p.total_price, p.net_effective
       FROM unit_prices p
       WHERE p.unit_id = ?
       ORDER BY p.scraped_at, p.move_in_date`,
    )
    .bind(unitId)
    .all();
}

/** Per-unit price over time, all move-in dates included. */
export async function queryPriceTimeline(db: D1Database) {
  return db
    .prepare(
      `SELECT p.scraped_at, p.unit_id, u.unit_name, u.floor_plan, u.sqft,
              p.move_in_date, p.lease_term, p.price, p.net_effective
       FROM unit_prices p
       JOIN units u ON p.unit_id = u.unit_id
       ORDER BY p.scraped_at, p.price`,
    )
    .all();
}

/** Day-over-day price changes: compares each unit's price to its previous scrape. */
export async function queryDailyChanges(db: D1Database) {
  return db
    .prepare(
      `WITH ranked AS (
         SELECT p.scraped_at, p.unit_id, u.unit_name, u.floor_plan, u.sqft,
                p.price, p.net_effective,
                LAG(p.price) OVER (PARTITION BY p.unit_id ORDER BY p.scraped_at) AS prev_price,
                LAG(p.net_effective) OVER (PARTITION BY p.unit_id ORDER BY p.scraped_at) AS prev_net
         FROM unit_prices p
         JOIN units u ON p.unit_id = u.unit_id
         WHERE p.move_in_date = (
           SELECT MIN(p2.move_in_date) FROM unit_prices p2
           WHERE p2.unit_id = p.unit_id AND p2.scraped_at = p.scraped_at
         )
       )
       SELECT *, price - prev_price AS price_delta, net_effective - prev_net AS net_delta
       FROM ranked
       WHERE prev_price IS NOT NULL
       ORDER BY scraped_at DESC, price_delta`,
    )
    .all();
}

/** Market summary per scrape day: min/max/avg across all units. */
export async function queryMarketSummary(db: D1Database) {
  return db
    .prepare(
      `SELECT p.scraped_at,
              MIN(p.price) AS min_price, MAX(p.price) AS max_price,
              ROUND(AVG(p.price)) AS avg_price,
              MIN(p.net_effective) AS min_net, MAX(p.net_effective) AS max_net,
              ROUND(AVG(p.net_effective)) AS avg_net,
              COUNT(DISTINCT p.unit_id) AS unit_count
       FROM unit_prices p
       WHERE p.move_in_date = (
         SELECT MIN(p2.move_in_date) FROM unit_prices p2
         WHERE p2.unit_id = p.unit_id AND p2.scraped_at = p.scraped_at
       )
       GROUP BY p.scraped_at
       ORDER BY p.scraped_at`,
    )
    .all();
}
