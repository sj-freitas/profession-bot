/* eslint-disable no-redeclare */
import { RaidEvent } from "../integrations/raid-helper/types";

export function isRaidEventInAmountOfTime(
  timestamp: number,
  amountOfTimeInMilliseconds: number,
): boolean;
export function isRaidEventInAmountOfTime(
  raidEvent: RaidEvent,
  amountOfTimeInMilliseconds: number,
): boolean;
export function isRaidEventInAmountOfTime(
  raidEvent: unknown,
  amountOfTimeInMilliseconds: number,
): boolean {
  const raidTime =
    typeof raidEvent === "number"
      ? raidEvent
      : (raidEvent as RaidEvent).startTime * 1000;
  const startTime = raidTime - amountOfTimeInMilliseconds;
  const currentTime = new Date().getTime();

  return currentTime > startTime;
}
