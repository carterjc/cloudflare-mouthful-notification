import { Hono } from "hono";
import { EmailMessage } from "cloudflare:email";
import { COMMUNITIES, getMoveInDates } from "./scrapers";
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
import { Dashboard } from "./pages/dashboard";
import { CommunityPage } from "./pages/community";

interface Env {
  DB: D1Database;
  SENDER_EMAIL: string;
  DESTINATION_EMAIL: string;
  SEND_EMAIL: { send: (m: EmailMessage) => Promise<void> };
}

const app = new Hono<{ Bindings: Env }>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toDateStr(d: Date): string {
  return d.toISOString().substring(0, 10);
}

async function scrape(db: D1Database) {
  const now = new Date();
  const today = toDateStr(now);
  const moveInDates = getMoveInDates(now);

  const results: { community: string; moveInDate: string; units: number }[] = [];

  for (const community of COMMUNITIES) {
    for (const mid of moveInDates) {
      const units = await community.scrape(mid);
      if (units.length === 0) continue;

      await upsertUnits(db, units, community.id, today);
      const midStr = toDateStr(mid);
      await insertPrices(db, units, today, midStr);
      results.push({ community: community.name, moveInDate: midStr, units: units.length });
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

app.get("/", async (c) => {
  const summary = await queryMarketSummary(c.env.DB);
  const rows = summary.results as { scraped_at: string }[];
  const lastScrape = rows.length > 0 ? rows[rows.length - 1].scraped_at : null;
  return c.html(
    <Dashboard
      communities={COMMUNITIES}
      summary={rows as never[]}
      lastScrape={lastScrape}
    />,
  );
});

app.get("/community/:id", async (c) => {
  const communityId = c.req.param("id");
  const community = COMMUNITIES.find((co) => co.id === communityId);
  if (!community) return c.json({ error: "community not found" }, 404);

  const [units, latest] = await Promise.all([
    queryUnits(c.env.DB, communityId),
    queryLatest(c.env.DB, communityId),
  ]);

  return c.html(
    <CommunityPage
      name={community.name}
      communityId={communityId}
      units={units.results as never[]}
      latest={latest.results as never[]}
    />,
  );
});

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

app.get("/api/communities", (c) => {
  return c.json(COMMUNITIES.map((co) => ({ id: co.id, name: co.name })));
});

app.get("/api/scrape", async (c) => {
  const results = await scrape(c.env.DB);
  return c.json({ ok: true, results });
});

app.get("/api/units", async (c) => {
  const communityId = c.req.query("community");
  const data = await queryUnits(c.env.DB, communityId);
  return c.json(data.results);
});

app.get("/api/latest", async (c) => {
  const communityId = c.req.query("community");
  const data = await queryLatest(c.env.DB, communityId);
  return c.json(data.results);
});

app.get("/api/history", async (c) => {
  const unitId = c.req.query("unit_id");
  if (!unitId) return c.json({ error: "unit_id required" }, 400);
  const data = await queryHistory(c.env.DB, unitId);
  return c.json(data.results);
});

app.get("/api/timeline", async (c) => {
  const communityId = c.req.query("community");
  const data = await queryPriceTimeline(c.env.DB, communityId);
  return c.json(data.results);
});

app.get("/api/changes", async (c) => {
  const data = await queryDailyChanges(c.env.DB);
  return c.json(data.results);
});

app.get("/api/summary", async (c) => {
  const data = await queryMarketSummary(c.env.DB);
  return c.json(data.results);
});

// ---------------------------------------------------------------------------
// Charts
// ---------------------------------------------------------------------------

app.get("/chart/timeline", async (c) => {
  const metric = c.req.query("metric") === "net" ? "net_effective" : "price";
  const unitId = c.req.query("unit_id");
  const communityId = c.req.query("community");
  const data = await queryPriceTimeline(c.env.DB, communityId);
  const rows = unitId
    ? (data.results as { unit_id: string }[]).filter((r) => r.unit_id === unitId)
    : data.results;
  const png = await renderTimelineChart(rows as never[], metric);
  if (!png) return c.body(null, 204);
  return new Response(png, { headers: { "Content-Type": "image/png" } });
});

// ---------------------------------------------------------------------------
// Scheduled
// ---------------------------------------------------------------------------

interface TimelineRow {
  unit_id: string;
  unit_name: string;
  community_id: string;
}

async function scheduled(env: Env) {
  const results = await scrape(env.DB);
  console.log("Scrape complete:", JSON.stringify(results));

  const charts: { filename: string; data: ArrayBuffer }[] = [];

  for (const community of COMMUNITIES) {
    const timeline = await queryPriceTimeline(env.DB, community.id);
    const rows = timeline.results as (TimelineRow & Record<string, unknown>)[];
    if (rows.length === 0) continue;

    const allChart = await renderTimelineChart(rows as never[], "price");
    if (allChart) charts.push({ filename: `${community.name} - all units.png`, data: allChart });

    const uniqueUnitIds = [...new Set(rows.map((r) => r.unit_id))];
    for (const uid of uniqueUnitIds.slice(0, 10)) {
      const unitRows = rows.filter((r) => r.unit_id === uid);
      const png = await renderTimelineChart(unitRows as never[], "price");
      if (png) charts.push({ filename: `${community.name} - ${unitRows[0].unit_name}.png`, data: png });
    }
  }

  if (charts.length === 0) return;

  const summaryData = await queryMarketSummary(env.DB);
  const summaryText = (
    summaryData.results as { scraped_at: string; community_id: string; avg_price: number; unit_count: number }[]
  )
    .map((r) => `${r.scraped_at} [${r.community_id}]: avg $${r.avg_price} (${r.unit_count} units)`)
    .join("\n");

  await sendReport(env.SENDER_EMAIL, env.DESTINATION_EMAIL, env.SEND_EMAIL, charts, summaryText);
  console.log("Report emailed");
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext) {
    await scheduled(env);
  },
};
