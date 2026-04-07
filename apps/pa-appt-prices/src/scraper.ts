export interface ScrapedUnit {
  unitId: string;
  unitName: string;
  sqft: number;
  floorPlan: string;
  finishPackage: string | null;
  floorNumber: string;
  price: number;
  totalPrice: number;
  netEffective: number;
  furnishedPrice: number | null;
  leaseTerm: number | null;
}

export interface Community {
  id: string;
  name: string;
  scrape: (moveInDate: Date) => Promise<ScrapedUnit[]>;
}

// ---------------------------------------------------------------------------
// Avalon Towers on the Peninsula
// ---------------------------------------------------------------------------

interface AvalonUnit {
  unitId: string;
  unitName: string;
  bedroomNumber: number;
  squareFeet: number;
  floorPlan: { name: string };
  finishPackage: { name: string } | null;
  floorNumber: string;
  startingAtPricesUnfurnished: {
    leaseTerm: number;
    prices: { price: number; totalPrice: number; netEffectivePrice: number };
  };
  startingAtPricesFurnished: {
    prices: { price: number };
  } | null;
}

async function fetchAvalon(moveInDate: Date): Promise<ScrapedUnit[]> {
  const query = JSON.stringify({
    arcSite: "avalon-communities",
    bedroomNumber: ["1"],
    communityId: "AVB-CA064",
    isMoveInDateFlexible: true,
    moveInDate: moveInDate.toISOString(),
    showFavorites: false,
    sortBy: "LowestPrice",
    unitHasPromotion: false,
  });

  const url = `https://www.avaloncommunities.com/pf/api/v3/content/fetch/community-units?query=${encodeURIComponent(query)}&_website=avalon-communities`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    },
  });

  if (!res.ok)
    throw new Error(`Avalon API returned ${res.status}: ${await res.text()}`);

  const data: { units: AvalonUnit[] } = await res.json();
  return data.units
    .filter((u) => u.bedroomNumber === 1)
    .map((u) => ({
      unitId: u.unitId,
      unitName: u.unitName,
      sqft: u.squareFeet,
      floorPlan: u.floorPlan.name,
      finishPackage: u.finishPackage?.name ?? null,
      floorNumber: u.floorNumber,
      price: u.startingAtPricesUnfurnished.prices.price,
      totalPrice: u.startingAtPricesUnfurnished.prices.totalPrice,
      netEffective: u.startingAtPricesUnfurnished.prices.netEffectivePrice,
      furnishedPrice: u.startingAtPricesFurnished?.prices.price ?? null,
      leaseTerm: u.startingAtPricesUnfurnished.leaseTerm,
    }));
}

// ---------------------------------------------------------------------------
// Montrose (Prometheus)
// ---------------------------------------------------------------------------

interface PrometheusUnit {
  unitID: string;
  unitLabel: string;
  area: string;
  floorPlanName: string;
  floor: string;
  rent: string;
  bestRent: string;
  bestTerm: string;
  bedrooms: string;
}

function toDateParam(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

async function fetchMontrose(moveInDate: Date): Promise<ScrapedUnit[]> {
  const url = `https://shopping.prometheusapartments-prod-west2.com/3848844/available-units?date=${toDateParam(moveInDate)}`;
  const res = await fetch(url);

  if (!res.ok)
    throw new Error(
      `Prometheus API returned ${res.status}: ${await res.text()}`,
    );

  const data: PrometheusUnit[] = await res.json();
  return data.map((u) => {
    const rent = parseFloat(u.rent);
    return {
      unitId: `PROM-${u.unitID}`,
      unitName: u.unitLabel,
      sqft: parseInt(u.area, 10),
      floorPlan: u.floorPlanName,
      finishPackage: null,
      floorNumber: u.floor,
      price: rent,
      totalPrice: rent,
      netEffective: parseInt(u.bestRent, 10),
      furnishedPrice: null,
      leaseTerm: parseInt(u.bestTerm, 10),
    };
  });
}

// ---------------------------------------------------------------------------
// Communities & helpers
// ---------------------------------------------------------------------------

export const COMMUNITIES: Community[] = [
  {
    id: "avalon-towers",
    name: "Avalon Towers on the Peninsula",
    scrape: fetchAvalon,
  },
  { id: "montrose", name: "Montrose", scrape: fetchMontrose },
];

export function getMoveInDates(now: Date): Date[] {
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  const endOfMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0),
  );

  const oneMonthOut = new Date(now);
  oneMonthOut.setUTCMonth(oneMonthOut.getUTCMonth() + 1);

  return [tomorrow, endOfMonth, oneMonthOut];
}
