const QUICKCHART_URL = "https://quickchart.io/chart";

const COLORS = [
  "#0d9488", "#6366f1", "#ea580c", "#2563eb", "#d946ef", "#ca8a04",
  "#dc2626", "#059669", "#7c3aed", "#0284c7", "#e11d48", "#4f46e5",
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
): Promise<ArrayBuffer | null> {
  if (rows.length === 0) return null;
  const dates = [...new Set(rows.map((r) => r.scraped_at))].sort();
  const singleUnit = new Set(rows.map((r) => r.unit_id)).size === 1;

  const bySeries = new Map<string, Map<string, number>>();

  for (const r of rows) {
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
    borderWidth: 1.5,
    fill: false,
    spanGaps: true,
    pointRadius: 2,
    pointHoverRadius: 3,
  }));

  const title = singleUnit
    ? `${rows[0].unit_name} — ${metric === "price" ? "Price" : "Net Effective"}`
    : `${metric === "price" ? "Price" : "Net Effective"} Over Time`;

  const config = {
    type: "line",
    data: { labels: dates, datasets },
    options: {
      title: { display: true, text: title, fontSize: 11, fontFamily: "Inter, sans-serif", fontColor: "#1c1917", padding: 6 },
      layout: { padding: { left: 4, right: 8, top: 0, bottom: 0 } },
      scales: {
        xAxes: [{
          ticks: { fontSize: 9, fontColor: "#78716c", fontFamily: "Inter, sans-serif", maxRotation: 45 },
          gridLines: { color: "#e7e5e4", lineWidth: 0.5 },
        }],
        yAxes: [{
          ticks: {
            fontSize: 9, fontColor: "#78716c", fontFamily: "Inter, sans-serif",
            callback: (v: number) => `$${v.toLocaleString()}`,
          },
          gridLines: { color: "#e7e5e4", lineWidth: 0.5 },
        }],
      },
      legend: {
        position: "bottom",
        labels: { boxWidth: 8, fontSize: 9, fontFamily: "Inter, sans-serif", fontColor: "#1c1917", padding: 8 },
      },
    },
  };

  const res = await fetch(QUICKCHART_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      width: 800,
      height: 360,
      backgroundColor: "#ffffff",
      devicePixelRatio: 2,
      chart: config,
    }),
  });

  if (!res.ok) throw new Error(`QuickChart error: ${res.status}`);
  return res.arrayBuffer();
}
