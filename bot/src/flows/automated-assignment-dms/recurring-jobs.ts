import { Client } from "discord.js";
import { CONFIG } from "../../config";
import { getRosterFromRaidEvent } from "../roster-helper";
import { Database } from "../../exports/mem-database";
import { RaidInfo, RaidInfoTable } from "../../integrations/sheets/raid-info";
import {
  fetchEvent,
  fetchServerEvents,
} from "../../integrations/raid-helper/raid-helper-client";
import {
  createSheetClient,
  SheetClient,
} from "../../integrations/sheets/config";
import { isRaidEventInAmountOfTime } from "../time-utils";
import { sendAssignmentDms } from "./raid-encounter-dm-assignments";

const THIRTY_MINUTES = 30 * 60 * 1000;

export async function pollChannelForDmAssignments(
  discordClient: Client,
  sheetClient: SheetClient,
  raidInfoTable: RaidInfoTable,
  database: Database,
  raidInfo: RaidInfo,
): Promise<void> {
  if (raidInfo.assignmentsLocked) {
    // Assignment DMs have been set so no need to do anything else.
    return;
  }

  const raidEvent = await fetchEvent(raidInfo.eventId);
  if (raidEvent === null) {
    return;
  }

  // Check if it's 30 minutes before the raid
  if (!isRaidEventInAmountOfTime(raidEvent, THIRTY_MINUTES)) {
    return;
  }

  const roster = await getRosterFromRaidEvent(raidEvent, database);

  await sendAssignmentDms(
    discordClient,
    sheetClient,
    raidEvent,
    roster,
    database,
  );

  // Update the hash
  await raidInfoTable.updateValue({
    ...raidInfo,
    assignmentsLocked: new Date(),
  });
}

export async function pollChannelsForDirectMessageAssignments(
  discordClient: Client,
  database: Database,
  channelIds: string[],
): Promise<void> {
  const channelIdsSet = new Set(channelIds);
  const sheetClient = createSheetClient();
  const raidInfoTable = new RaidInfoTable(sheetClient, CONFIG.GUILD.INFO_SHEET);
  const allRaids = await raidInfoTable.getAllValues();
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
      const matchingRaid = allRaids.find((t) => t.eventId === trackedEvent.id);
      if (!matchingRaid) {
        return;
      }
      if (!trackedEvent.startTime) {
        return;
      }

      await pollChannelForDmAssignments(
        discordClient,
        sheetClient,
        raidInfoTable,
        database,
        matchingRaid,
      );
    }),
  );
}
