import { RaidEvent } from "../../integrations/raid-helper/types";
import { getRosterFromRaidEvent } from "../roster-helper";
import {
  createSheetClient,
  SheetClient,
} from "../../integrations/sheets/config";
import { isRaidEventInAmountOfTime } from "../time-utils";
import { getAssignmentConfigAndHistory } from "../raid-assignments/world-buff-assignments";
import { getInstanceInfosFromRaidEventId } from "../raid-info-utils";
import { CONFIG } from "../../config";
import { Database } from "../../exports/mem-database";
import {
  addToHistory,
  getNamesOfAllGroups,
  NUMBER_OF_GROUPS,
} from "../../integrations/sheets/get-buffers";
import { findNextAssignment } from "../../buff-management/find-next-assignment";
import { formatGroupsForSheets } from "../../exports/world-buffs/format-groups-for-sheets";
import {
  fetchEvent,
  fetchServerEvents,
} from "../../integrations/raid-helper/raid-helper-client";

const { INFO_SHEET } = CONFIG.GUILD;
const TWENTY_MINUTES_AFTER_RAID = -1 * 20 * 60 * 1000;

function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    timeZone: "CET",
    year: "numeric",
    hour12: false,
  };

  const formatter = new Intl.DateTimeFormat("de-DE", options);
  return formatter.format(date).replace(/,/g, "");
}

export async function updateWorldBuffHistory(
  sheetClient: SheetClient,
  database: Database,
  raidEvent: RaidEvent,
) {
  // Runs every 20 mins AFTER the raid. Should only run once.
  if (
    !isRaidEventInAmountOfTime(
      raidEvent.startTime * 1000,
      TWENTY_MINUTES_AFTER_RAID,
    )
  ) {
    return;
  }

  const instanceInfos = await getInstanceInfosFromRaidEventId(
    sheetClient,
    INFO_SHEET,
    raidEvent.id,
  );
  if (
    instanceInfos.length === 0 ||
    instanceInfos.every((t) => !t.useWorldBuffs)
  ) {
    // This raid is not world buff compatible, that's ok, nothing to do.
    return;
  }

  // Check if assignments are already there
  const eventDateFormatted = formatDate(new Date(raidEvent.startTime * 1000));
  const titleToFind = `ASSIGNMENTS ${eventDateFormatted}`;
  const allGroupNames = await getNamesOfAllGroups(sheetClient, INFO_SHEET);
  if (allGroupNames.some((t) => t.indexOf(titleToFind) === 0)) {
    // Group exists, do nothing
    return;
  }

  // Assign world buffs
  const roster = await getRosterFromRaidEvent(raidEvent, database);
  const allPlayersWithMains = roster.characters
    .filter((t) => t.isMainCharacter)
    .map((t) => t.player);
  const { assignmentConfig, rawAssignmentConfig, history } =
    getAssignmentConfigAndHistory(database);
  const assignment = findNextAssignment({
    history,
    assignmentConfig,
    roster: allPlayersWithMains,
    numberOfGroups: NUMBER_OF_GROUPS,
  });

  // Create the Sheet Format
  const formattedForSheets = formatGroupsForSheets(
    assignment,
    rawAssignmentConfig,
    eventDateFormatted,
  );

  await addToHistory(sheetClient, INFO_SHEET, formattedForSheets);
}

export async function pollChannelsForWorldBuffHistory(
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

      await updateWorldBuffHistory(sheetClient, database, raidEvent);
    }),
  );
}
