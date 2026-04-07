import type { Community } from "../scrapers";
import { Layout } from "./layout";

interface SummaryRow {
  scraped_at: string;
  community_id: string;
  avg_price: number;
  min_price: number;
  max_price: number;
  unit_count: number;
}

function nextCronRun(): string {
  // Cron is 0 14 * * * (daily at 14:00 UTC)
  const now = new Date();
  const next = new Date(now);
  next.setUTCHours(14, 0, 0, 0);
  if (now >= next) next.setUTCDate(next.getUTCDate() + 1);

  const diff = next.getTime() - now.getTime();
  const hours = Math.floor(diff / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  return `${hours}h ${mins}m`;
}

export function Dashboard({
  communities,
  summary,
  lastScrape,
}: {
  communities: Community[];
  summary: SummaryRow[];
  lastScrape: string | null;
}) {
  const latestByComm = new Map<string, SummaryRow>();
  for (const r of summary) {
    latestByComm.set(r.community_id, r);
  }

  return (
    <Layout title="Apt Price Tracker">
      <div class="header">
        <h1>Apt Price Tracker</h1>
        <div class="header-right">
          <span class="meta">
            Next scrape in {nextCronRun()} &middot;{" "}
            {lastScrape ? `Last: ${lastScrape}` : "No scrapes yet"}
          </span>
          <a href="/api/scrape" class="btn btn-primary" id="scrape-btn"
            onclick="event.preventDefault(); this.textContent='Scraping...'; this.classList.add('disabled'); fetch('/api/scrape').then(r=>r.json()).then(d=>{this.textContent='Done!'; setTimeout(()=>location.reload(), 1000)}).catch(()=>{this.textContent='Error'; this.classList.remove('disabled')})">
            Scrape Now
          </a>
        </div>
      </div>

      <div class="grid">
        {communities.map((c) => {
          const s = latestByComm.get(c.id);
          return (
            <a href={`/community/${c.id}`} class="card-link">
              <div class="card">
                <div class="community-name">{c.name}</div>
                {s ? (
                  <div>
                    <div class="stats">
                      <div class="stat-item">
                        <span class="stat-label">Avg</span>
                        <span class="stat-value price">${s.avg_price.toLocaleString()}</span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-label">Min</span>
                        <span class="stat-value price">${s.min_price.toLocaleString()}</span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-label">Max</span>
                        <span class="stat-value price">${s.max_price.toLocaleString()}</span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-label">Units</span>
                        <span class="stat-value">{s.unit_count}</span>
                      </div>
                    </div>
                    <span class="badge">{s.scraped_at}</span>
                  </div>
                ) : (
                  <span class="meta">No data yet — run a scrape</span>
                )}
                <img class="chart-img" src={`/chart/timeline?community=${c.id}`} alt={`${c.name} chart`} loading="lazy" />
              </div>
            </a>
          );
        })}
      </div>
    </Layout>
  );
}
