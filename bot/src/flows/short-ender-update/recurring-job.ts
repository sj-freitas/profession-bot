import { CONFIG } from "../../config";
import { Database } from "../../exports/mem-database";
import {
  fetchEvent,
  fetchServerEvents,
} from "../../integrations/raid-helper/raid-helper-client";
import { RaidEvent } from "../../integrations/raid-helper/types";
import {
  createSheetClient,
  SheetClient,
} from "../../integrations/sheets/config";
import {
  getRosterFromRaidEvent,
  toRaidAssignmentRoster,
} from "../roster-helper";
import { isRaidEventInAmountOfTime } from "../time-utils";
import { updateShortEnders } from "./update-short-enders";

const TWENTY_MINUTES_AFTER_RAID = -1 * 20 * 60 * 1000;

export async function updateShortEnderIfRaidIsOver(
  sheetClient: SheetClient,
  database: Database,
  raidEvent: RaidEvent,
) {
  if (
    !isRaidEventInAmountOfTime(
      raidEvent.startTime * 1000,
      TWENTY_MINUTES_AFTER_RAID,
    )
  ) {
    return;
  }

  const roster = await getRosterFromRaidEvent(raidEvent, database);
  const raidAssignmentRoster = toRaidAssignmentRoster(roster);

  await updateShortEnders(sheetClient, raidAssignmentRoster);
}

export async function pollChannelsToUpdateShortEndersAfterRaids(
  database: Database,
  channelIds: string[],
): Promise<void> {
  const channelIdsSet = new Set(channelIds);
  const sheetClient = createSheetClient();
  const serverEvents = await fetchServerEvents(CONFIG.GUILD.DISCORD_SERVER_ID);
  if (serverEvents === null) {
    return;
  }

  // Channels with raids
  const trackedServerEvents = (serverEvents.postedEvents ?? []).filter((t) =>
    channelIdsSet.has(t.channelId),
  );

  await Promise.all(
    trackedServerEvents.map(async (trackedEvent) => {
      const raidEvent = await fetchEvent(trackedEvent.id);
      if (!raidEvent) {
        return;
      }
      if (!raidEvent.startTime) {
        return;
      }

      await updateShortEnderIfRaidIsOver(sheetClient, database, raidEvent);
    }),
  );
}
