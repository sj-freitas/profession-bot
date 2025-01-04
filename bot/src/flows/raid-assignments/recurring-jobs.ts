import { Client } from "discord.js";
import {
  fetchEvent,
  fetchServerEvents,
} from "../../raid-helper/raid-helper-client";
import { CONFIG } from "../../config";
import { RaidInfo, RaidInfoTable } from "../../sheets/raid-info";
import { createSheetClient } from "../../sheets/config";
import { getRosterFromRaidEvent } from "../roster-helper";
import { Database } from "../../exports/mem-database";
import { tryPostWorldBuffAssignments } from "./world-buff-assignments";
import { tryPostRaidComposition } from "./raid-composition-assignments";
import { tryPostFightAssignments } from "./raid-encounter-assignments";
import { tryAdvertiseMissingSoftReserves } from "./advertise-missing-softreserves";
import { tryNotifyOfficersMissingSignUps } from "./notify-officers-missing-signups";

const NUMBER_OF_DAYS_BEFORE_ASSIGNMENTS = 3;

export async function pollChannelForWorldBuffAssignments(
  discordClient: Client,
  raidInfoTable: RaidInfoTable,
  database: Database,
  raidInfo: RaidInfo,
): Promise<void> {
  const raidEvent = await fetchEvent(raidInfo.eventId);
  const roster = await getRosterFromRaidEvent(raidEvent);
  if (raidInfo.rosterHash === roster.rosterHash) {
    return;
  }

  // Roster has updated, trigger all post changes and assignments
  await tryPostWorldBuffAssignments(discordClient, raidEvent, roster, database);
  await tryPostRaidComposition();
  await tryPostFightAssignments();
  await tryAdvertiseMissingSoftReserves();
  await tryNotifyOfficersMissingSignUps();

  // Update the hash
  await raidInfoTable.updateValue({
    ...raidInfo,
    rosterHash: roster.rosterHash,
    lastUpdated: new Date().toString(),
  });
}

export async function pollChannelsForAssignments(
  discordClient: Client,
  database: Database,
  channelIds: string[],
): Promise<void> {
  const channelIdsSet = new Set(channelIds);
  const sheetClient = createSheetClient();
  const raidInfoTable = new RaidInfoTable(sheetClient, CONFIG.GUILD.INFO_SHEET);
  const allRaids = await raidInfoTable.getAllValues();
  const serverEvents = await fetchServerEvents(CONFIG.GUILD.DISCORD_SERVER_ID);

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

      // Only do this IF we are 24 hours before the raid!
      if (!trackedEvent.startTime) {
        return;
      }
      const raidTime = new Date(trackedEvent.startTime * 1000);
      const oneDayBeforeRaid = new Date().setDate(
        raidTime.getDate() - NUMBER_OF_DAYS_BEFORE_ASSIGNMENTS,
      );
      if (new Date().getTime() < oneDayBeforeRaid) {
        return;
      }

      await pollChannelForWorldBuffAssignments(
        discordClient,
        raidInfoTable,
        database,
        matchingRaid,
      );
    }),
  );
}
