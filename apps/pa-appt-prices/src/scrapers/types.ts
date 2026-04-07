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
