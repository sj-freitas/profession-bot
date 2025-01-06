import { Client } from "discord.js";
import { findNextAssignment } from "../../buff-management/find-next-assignment";
import {
  mapRawAssignmentConfig,
  mapRawHistory,
} from "../../buff-management/utils";
import { Database } from "../../exports/mem-database";
import { formatGroupAssignmentsToMarkdown } from "../../exports/world-buffs/format-group-assigments-md";
import { NUMBER_OF_GROUPS } from "../../integrations/sheets/get-buffers";
import { Roster } from "../roster-helper";
import { RaidEvent } from "../../integrations/raid-helper/types";
import {
  createOrEditDiscordMessage,
  findMessageInHistory,
} from "../../discord/utils";
import { isRaidEventInAmountOfTime } from "../time-utils";
import { formatGroupsForSheets } from "../../exports/world-buffs/format-groups-for-sheets";
import { CONFIG } from "../../config";

const THREE_DAYS_BEFORE_RAID = 3 * 24 * 60 * 60 * 1000;
const { STAFF_RAID_CHANNEL_ID } = CONFIG.GUILD;

function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "CET",
    hour12: false,
  };

  const formatter = new Intl.DateTimeFormat("de-DE", options);
  return formatter.format(date).replace(/,/g, "");
}

export function getAssignmentConfigAndHistory(database: Database) {
  const rawHistory = database.getWorldBuffHistory();
  const rawAssignmentConfig = database.getWorldBuffAssignments();
  const allPlayers = database.getPlayersRoster();
  const playerMap = new Map(allPlayers.map((t) => [t.discordHandle, t]));
  const history = mapRawHistory(rawHistory, playerMap);
  const assignmentConfig = mapRawAssignmentConfig(
    rawAssignmentConfig,
    playerMap,
  );

  return {
    history,
    assignmentConfig,
    rawAssignmentConfig,
  };
}

export async function worldBuffAssignmentMessageExists(
  discordClient: Client,
  raidEvent: RaidEvent,
): Promise<boolean> {
  const messageTag = "## World buff item rotation";

  return Boolean(
    await findMessageInHistory(discordClient, raidEvent.channelId, messageTag),
  );
}

export async function tryPostWorldBuffAssignments(
  discordClient: Client,
  database: Database,
  raidEvent: RaidEvent,
  roster: Roster,
): Promise<void> {
  // Check if it's 3 days before the raid
  if (!isRaidEventInAmountOfTime(raidEvent, THREE_DAYS_BEFORE_RAID)) {
    return;
  }

  // Assign world buffs
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

  // Format
  const formatted = formatGroupAssignmentsToMarkdown(
    assignment,
    new Map(
      rawAssignmentConfig.map(({ buffInfo }) => [buffInfo.shortName, buffInfo]),
    ),
  );

  // Raid Channel
  await createOrEditDiscordMessage(
    discordClient,
    raidEvent.channelId,
    "## World buff item rotation",
    formatted,
  );

  // Staff Channel
  const eventDateFormatted = formatDate(new Date(raidEvent.startTime * 1000));
  const tag = `ASSIGNMENTS ${eventDateFormatted}`;
  const formattedForSheets = formatGroupsForSheets(
    assignment,
    rawAssignmentConfig,
    eventDateFormatted,
  );

  await createOrEditDiscordMessage(
    discordClient,
    STAFF_RAID_CHANNEL_ID,
    tag,
    formattedForSheets,
  );
}
