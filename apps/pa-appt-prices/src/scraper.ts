const BASE_URL =
  "https://www.avaloncommunities.com/pf/api/v3/content/fetch/community-units";
const COMMUNITY_ID = "AVB-CA064";

export interface AvalonUnit {
  unitId: string;
  unitName: string;
  bedroomNumber: number;
  bathroomNumber: number;
  squareFeet: number;
  floorPlan: { name: string };
  finishPackage: { name: string; description: string } | null;
  floorNumber: string;
  unitStatus: string;
  availableDateUnfurnished: string;
  availableDateFurnished: string | null;
  startingAtPricesUnfurnished: {
    moveInDate: string;
    leaseTerm: number;
    prices: { price: number; totalPrice: number; netEffectivePrice: number };
  };
  startingAtPricesFurnished: {
    moveInDate: string;
    leaseTerm: number;
    prices: { price: number; totalPrice: number; netEffectivePrice: number };
  } | null;
}

interface ApiResponse {
  units: AvalonUnit[];
}

export async function fetchUnits(moveInDate: Date): Promise<AvalonUnit[]> {
  const query = JSON.stringify({
    arcSite: "avalon-communities",
    bedroomNumber: ["1"],
    communityId: COMMUNITY_ID,
    isMoveInDateFlexible: true,
    moveInDate: moveInDate.toISOString(),
    showFavorites: false,
    sortBy: "LowestPrice",
    unitHasPromotion: false,
  });

  const url = `${BASE_URL}?query=${encodeURIComponent(query)}&_website=avalon-communities`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    },
  });

  if (!res.ok) {
    throw new Error(`Avalon API returned ${res.status}: ${await res.text()}`);
  }

  const data: ApiResponse = await res.json();
  return data.units.filter((u) => u.bedroomNumber === 1);
}

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
