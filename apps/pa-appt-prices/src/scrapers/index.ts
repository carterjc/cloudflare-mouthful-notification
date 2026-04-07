export type { ScrapedUnit, Community } from "./types";
export { avalonTowers } from "./avalon";
export { montrose, theDean, madera, parkPlace } from "./prometheus";

import { avalonTowers } from "./avalon";
import { montrose, theDean, madera, parkPlace } from "./prometheus";
import type { Community } from "./types";

export const COMMUNITIES: Community[] = [
  avalonTowers,
  montrose,
  theDean,
  madera,
  parkPlace,
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
