import { EmailMessage } from "cloudflare:email";
import { fetchUnits, getMoveInDates } from "./scraper";
import {
  upsertUnits,
  insertPrices,
  queryUnits,
  queryLatest,
  queryHistory,
  queryPriceTimeline,
  queryDailyChanges,
  queryMarketSummary,
} from "./db";
import { renderTimelineChart } from "./chart";
import { sendReport } from "./email";

interface Env {
  DB: D1Database;
  SENDER_EMAIL: string;
  DESTINATION_EMAIL: string;
  SEND_EMAIL: { send: (m: EmailMessage) => Promise<void> };
}

function toDateStr(d: Date): string {
  return d.toISOString().substring(0, 10);
}

async function scrape(db: D1Database) {
  const now = new Date();
  const today = toDateStr(now);
  const moveInDates = getMoveInDates(now);

  const results: { moveInDate: string; units: number }[] = [];

  for (const mid of moveInDates) {
    const units = await fetchUnits(mid);
    if (units.length === 0) continue;

    await upsertUnits(db, units, today);
    const midStr = toDateStr(mid);
    await insertPrices(db, units, today, midStr);
    results.push({ moveInDate: midStr, units: units.length });
  }

  return results;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext) {
    const results = await scrape(env.DB);
    console.log("Scrape complete:", JSON.stringify(results));

    // Generate charts and email report
    interface TimelineRow {
      unit_id: string;
      unit_name: string;
    }

    const timeline = await queryPriceTimeline(env.DB);
    const rows = timeline.results as (TimelineRow & Record<string, unknown>)[];
    if (rows.length === 0) return;

    const [allUnitsChart, summaryData] = await Promise.all([
      renderTimelineChart(rows as never[], "price"),
      queryMarketSummary(env.DB),
    ]);

    // Per-unit charts
    const uniqueUnitIds = [...new Set(rows.map((r) => r.unit_id))];

    const unitCharts = await Promise.all(
      uniqueUnitIds.slice(0, 10).map(async (uid) => {
        const unitRows = rows.filter((r) => r.unit_id === uid);
        const png = await renderTimelineChart(unitRows as never[], "price");
        return { filename: `${unitRows[0].unit_name}.png`, data: png };
      }),
    );

    const summaryText = (summaryData.results as { scraped_at: string; avg_price: number; unit_count: number }[])
      .map((r) => `${r.scraped_at}: avg $${r.avg_price} (${r.unit_count} units)`)
      .join("\n");

    await sendReport(
      env.SENDER_EMAIL,
      env.DESTINATION_EMAIL,
      env.SEND_EMAIL,
      [{ filename: "all-units.png", data: allUnitsChart }, ...unitCharts],
      summaryText,
    );
    console.log("Report emailed");
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    switch (url.pathname) {
      case "/api/scrape": {
        const results = await scrape(env.DB);
        return json({ ok: true, results });
      }
      case "/api/units": {
        const data = await queryUnits(env.DB);
        return json(data.results);
      }
      case "/api/latest": {
        const data = await queryLatest(env.DB);
        return json(data.results);
      }
      case "/api/history": {
        const unitId = url.searchParams.get("unit_id");
        if (!unitId) return json({ error: "unit_id required" }, 400);
        const data = await queryHistory(env.DB, unitId);
        return json(data.results);
      }
      case "/api/timeline": {
        const data = await queryPriceTimeline(env.DB);
        return json(data.results);
      }
      case "/api/changes": {
        const data = await queryDailyChanges(env.DB);
        return json(data.results);
      }
      case "/api/summary": {
        const data = await queryMarketSummary(env.DB);
        return json(data.results);
      }
      case "/chart/timeline": {
        const metric = url.searchParams.get("metric") === "net" ? "net_effective" : "price";
        const unitId = url.searchParams.get("unit_id");
        const data = await queryPriceTimeline(env.DB);
        const rows = unitId
          ? (data.results as { unit_id: string }[]).filter((r) => r.unit_id === unitId)
          : data.results;
        if (rows.length === 0) return json({ error: "no data" }, 404);
        const png = await renderTimelineChart(rows as never[], metric);
        return new Response(png, { headers: { "Content-Type": "image/png" } });
      }
      default:
        return json({ error: "not found" }, 404);
    }
  },
};
