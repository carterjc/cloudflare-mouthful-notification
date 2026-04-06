const QUICKCHART_URL = "https://quickchart.io/chart";

const COLORS = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899",
  "#06b6d4", "#f97316", "#84cc16", "#6366f1", "#14b8a6", "#e11d48",
];

interface TimelineRow {
  scraped_at: string;
  unit_id: string;
  unit_name: string;
  floor_plan: string;
  sqft: number;
  move_in_date: string;
  price: number;
  net_effective: number;
}

export async function renderTimelineChart(
  rows: TimelineRow[],
  metric: "price" | "net_effective" = "price",
): Promise<ArrayBuffer> {
  const dates = [...new Set(rows.map((r) => r.scraped_at))].sort();
  const singleUnit = new Set(rows.map((r) => r.unit_id)).size === 1;

  const bySeries = new Map<string, Map<string, number>>();

  for (const r of rows) {
    // Single unit: one line per move-in date. Multiple units: one line per unit (earliest move-in).
    const key = singleUnit
      ? `move-in ${r.move_in_date}`
      : `${r.unit_name} (${r.floor_plan}, ${r.sqft}sf)`;

    if (!singleUnit && bySeries.get(key)?.has(r.scraped_at)) continue;
    if (!bySeries.has(key)) bySeries.set(key, new Map());
    bySeries.get(key)!.set(r.scraped_at, r[metric]);
  }

  const datasets = [...bySeries.entries()].map(([label, points], i) => ({
    label,
    data: dates.map((d) => points.get(d) ?? null),
    borderColor: COLORS[i % COLORS.length],
    fill: false,
    spanGaps: true,
    pointRadius: 3,
  }));

  const title = singleUnit
    ? `${rows[0].unit_name} — ${metric === "price" ? "Listed Price" : "Net Effective"} by Move-in Date`
    : `All Units — ${metric === "price" ? "Listed Price" : "Net Effective"} Over Time`;

  const config = {
    type: "line",
    data: { labels: dates, datasets },
    options: {
      title: { display: true, text: title },
      scales: {
        yAxes: [{ ticks: { callback: (v: number) => `$${v.toLocaleString()}` } }],
      },
      legend: { position: "bottom", labels: { boxWidth: 10, fontSize: 10 } },
    },
  };

  const res = await fetch(QUICKCHART_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ width: 900, height: 500, backgroundColor: "white", chart: config }),
  });

  if (!res.ok) throw new Error(`QuickChart error: ${res.status}`);
  return res.arrayBuffer();
}
