import type { Community, ScrapedUnit } from "./types";

interface PrometheusUnit {
  unitID: string;
  unitLabel: string;
  area: string;
  floorPlanName: string;
  floor: string;
  rent: string;
  bestRent: string;
  bestTerm: string;
}

function toDateParam(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function prometheusCommunity(propertyId: string, id: string, name: string): Community {
  return {
    id,
    name,
    async scrape(moveInDate: Date): Promise<ScrapedUnit[]> {
      const url = `https://shopping.prometheusapartments-prod-west2.com/${propertyId}/available-units?date=${toDateParam(moveInDate)}`;
      const res = await fetch(url);

      if (!res.ok) throw new Error(`Prometheus API (${name}) returned ${res.status}: ${await res.text()}`);

      const data: PrometheusUnit[] = await res.json();
      return data.map((u) => {
        const rent = parseFloat(u.rent);
        return {
          unitId: `PROM-${propertyId}-${u.unitID}`,
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
    },
  };
}

export const montrose = prometheusCommunity("3848844", "montrose", "Montrose");
export const theDean = prometheusCommunity("4495429", "the-dean", "The Dean");
export const madera = prometheusCommunity("2757018", "madera", "Madera");
export const parkPlace = prometheusCommunity("4500556", "park-place", "Park Place");
