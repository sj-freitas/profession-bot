import { RaidEvent } from "../integrations/raid-helper/types";

export function isRaidEventInAmountOfTime(
  raidEvent: RaidEvent,
  amountOfTimeInMilliseconds: number,
): boolean {
  const raidTime = raidEvent.startTime * 1000;
  const startTime = raidTime - amountOfTimeInMilliseconds;
  const currentTime = new Date().getTime();

  return currentTime > startTime;
}
