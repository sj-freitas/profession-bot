import { Client } from "discord.js";
import { CONFIG } from "../../config";
import { getRosterFromRaidEvent } from "../roster-helper";
import { Database } from "../../exports/mem-database";
import {
  tryPostWorldBuffAssignments,
  worldBuffAssignmentMessageExists,
} from "./world-buff-assignments";
import {
  raidCompositionMessageExists,
  tryPostRaidComposition,
} from "./raid-composition-assignments";
import { tryPostFightAssignments } from "./raid-encounter-assignments";
import { tryAdvertiseMissingSoftReserves } from "./advertise-missing-softreserves";
import {
  officerNotificationMissingSignUpsMessageExists,
  tryNotifyOfficersMissingSignUps,
} from "./notify-officers-missing-signups";
import { RaidInfo, RaidInfoTable } from "../../integrations/sheets/raid-info";
import {
  fetchEvent,
  fetchServerEvents,
} from "../../integrations/raid-helper/raid-helper-client";
import {
  createSheetClient,
  SheetClient,
} from "../../integrations/sheets/config";

export async function pollChannelForWorldBuffAssignments(
  discordClient: Client,
  sheetClient: SheetClient,
  raidInfoTable: RaidInfoTable,
  database: Database,
  raidInfo: RaidInfo,
): Promise<void> {
  const raidEvent = await fetchEvent(raidInfo.eventId);
  if (raidEvent === null) {
    return;
  }

  const roster = await getRosterFromRaidEvent(raidEvent, database);
  const rosterForSoftreserves = await getRosterFromRaidEvent(
    raidEvent,
    database,
    {
      includeBench: true,
      includeLate: true,
      includeTentative: true,
    },
  );

  // Stuff that should be done even if the hash doesn't changed, since this
  // isn't really tracked by the hash itself.
  await tryAdvertiseMissingSoftReserves(
    discordClient,
    sheetClient,
    raidEvent,
    rosterForSoftreserves,
  );

  const worldBuffAssignmentMessageExistsInHistory =
    await worldBuffAssignmentMessageExists(discordClient, raidEvent);
  if (!worldBuffAssignmentMessageExistsInHistory) {
    await tryPostWorldBuffAssignments(
      discordClient,
      database,
      raidEvent,
      roster,
    );
  }

  const raidCompositionMessageExistsInHistory =
    await raidCompositionMessageExists(discordClient, raidEvent);
  if (!raidCompositionMessageExistsInHistory) {
    await tryPostRaidComposition(discordClient, raidEvent, roster);
    await tryPostFightAssignments(
      discordClient,
      sheetClient,
      raidEvent,
      roster,
    );
  }

  const officerNotificationMissingSignUpsMessageExistsInHistory =
    await officerNotificationMissingSignUpsMessageExists(
      discordClient,
      raidEvent,
    );
  if (!officerNotificationMissingSignUpsMessageExistsInHistory) {
    await tryNotifyOfficersMissingSignUps(discordClient, database, raidEvent);
  }

  if (raidInfo.rosterHash === roster.rosterHash) {
    // Hashes match, nothing needs to change.
    return;
  }

  // Roster has updated, trigger all post changes and assignments
  await tryPostWorldBuffAssignments(discordClient, database, raidEvent, roster);
  await tryNotifyOfficersMissingSignUps(discordClient, database, raidEvent);
  await tryPostRaidComposition(discordClient, raidEvent, roster);
  await tryPostFightAssignments(discordClient, sheetClient, raidEvent, roster);

  // Update the hash
  await raidInfoTable.updateValue({
    ...raidInfo,
    rosterHash: roster.rosterHash,
    lastUpdated: new Date(),
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

      await pollChannelForWorldBuffAssignments(
        discordClient,
        sheetClient,
        raidInfoTable,
        database,
        matchingRaid,
      );
    }),
  );
}
