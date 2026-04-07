import { Layout } from "./layout";

interface UnitRow {
  unit_id: string;
  unit_name: string;
  sqft: number;
  floor_plan: string;
  finish_package: string | null;
  floor_number: string;
  first_seen: string;
  last_seen: string;
}

interface LatestRow {
  unit_id: string;
  unit_name: string;
  price: number;
  net_effective: number;
  move_in_date: string;
  lease_term: number | null;
}

export function CommunityPage({
  name,
  communityId,
  units,
  latest,
}: {
  name: string;
  communityId: string;
  units: UnitRow[];
  latest: LatestRow[];
}) {
  const bestByUnit = new Map<string, LatestRow>();
  for (const r of latest) {
    if (!bestByUnit.has(r.unit_id)) bestByUnit.set(r.unit_id, r);
  }

  return (
    <Layout title={name}>
      <div class="header">
        <h1>{name}</h1>
        <span class="badge">{units.length} units tracked</span>
      </div>

      <img
        class="chart-img"
        src={`/chart/timeline?community=${communityId}`}
        alt="All units price timeline"
        style="max-width:900px"
        loading="lazy"
      />

      <h2>Current Prices</h2>
      <div class="card" style="padding:0; overflow-x:auto">
        <table>
          <thead>
            <tr>
              <th>Unit</th>
              <th>Floor</th>
              <th>Plan</th>
              <th>Sqft</th>
              <th>Price</th>
              <th>Net Eff.</th>
              <th>Move-in</th>
              <th>Term</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {units.map((u) => {
              const p = bestByUnit.get(u.unit_id);
              return (
                <tr>
                  <td style="font-weight:500">{u.unit_name}</td>
                  <td>{u.floor_number}</td>
                  <td>{u.floor_plan}</td>
                  <td>{u.sqft}</td>
                  <td class="mono">{p ? `$${p.price.toLocaleString()}` : "—"}</td>
                  <td class="mono">{p ? `$${p.net_effective.toLocaleString()}` : "—"}</td>
                  <td>{p?.move_in_date ?? "—"}</td>
                  <td>{p?.lease_term ? `${p.lease_term}mo` : "—"}</td>
                  <td>
                    <a href={`/chart/timeline?unit_id=${u.unit_id}`} class="btn" style="padding:4px 10px; font-size:0.75rem">
                      Chart
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
