import type { Community, ScrapedUnit } from "./types";

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

export const avalonTowers: Community = {
  id: "avalon-towers",
  name: "Avalon Towers on the Peninsula",
  scrape: fetchAvalon,
};
