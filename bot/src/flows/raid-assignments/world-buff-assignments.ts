import { Client } from "discord.js";
import { findNextAssignment } from "../../buff-management/find-next-assignment";
import {
  mapRawAssignmentConfig,
  mapRawHistory,
} from "../../buff-management/utils";
import { Database } from "../../exports/mem-database";
import {
  formatGroupAssignmentsToMarkdown,
  formatGroupAssignmentsToStaffRaidWarning,
} from "../../exports/world-buffs/format-group-assigments-md";
import { NUMBER_OF_GROUPS } from "../../integrations/sheets/get-buffers";
import { Roster } from "../roster-helper";
import { RaidEvent } from "../../integrations/raid-helper/types";
import {
  createOrEditDiscordMessage,
  findMessageOfBotInHistory,
} from "../../discord/utils";
import { isRaidEventInAmountOfTime } from "../time-utils";
import { CONFIG } from "../../config";
import { getInstanceInfosFromRaidEventId } from "../raid-info-utils";
import { createSheetClient } from "../../integrations/sheets/config";

const THREE_DAYS_BEFORE_RAID = 3 * 24 * 60 * 60 * 1000;
const { INFO_SHEET, STAFF_RAID_CHANNEL_ID } = CONFIG.GUILD;

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
    await findMessageOfBotInHistory(
      discordClient,
      raidEvent.channelId,
      messageTag,
    ),
  );
}

const MESSAGE_TAG = "## World buff item rotation";

export async function tryPostWorldBuffAssignments(
  discordClient: Client,
  database: Database,
  raidEvent: RaidEvent,
  roster: Roster,
): Promise<void> {
  // Check if it's 3 days before the raid
  // TODO STOP DOING IT AFTER THE ASSIGNMENT IS LOCKED
  // WORLD_BUFF_ASSIGNMENT_LOCK_BEFORE_RAID_IN_SECONDS
  if (!isRaidEventInAmountOfTime(raidEvent, THREE_DAYS_BEFORE_RAID)) {
    return;
  }
  // if (
  //   isRaidEventInAmountOfTime(
  //     raidEvent,
  //     WORLD_BUFF_ASSIGNMENT_LOCK_BEFORE_RAID_IN_SECONDS,
  //   )
  // ) {
  //   // DEBUG
  //   // Stop running this update 24 hours before the raid.
  //   return;
  // }
  const instanceInfos = await getInstanceInfosFromRaidEventId(
    createSheetClient(),
    INFO_SHEET,
    raidEvent.id,
  );

  if (
    instanceInfos.length === 0 ||
    instanceInfos.every((t) => !t.useWorldBuffs)
  ) {
    // None of these dungeons require world buffs
    // We might have to delete existing messages
    const message = await findMessageOfBotInHistory(
      discordClient,
      raidEvent.channelId,
      MESSAGE_TAG,
    );

    if (message) {
      await message.delete();
    }
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
  const assignmentsMap = new Map(
    rawAssignmentConfig.map(({ buffInfo }) => [buffInfo.shortName, buffInfo]),
  );
  const formatted = formatGroupAssignmentsToMarkdown(
    assignment,
    assignmentsMap,
  );

  // Raid Channel
  await createOrEditDiscordMessage(
    discordClient,
    raidEvent.channelId,
    MESSAGE_TAG,
    formatted,
  );

  // Officer Channel
  const [messageTag, message] = formatGroupAssignmentsToStaffRaidWarning(
    assignment,
    assignmentsMap,
    raidEvent,
  );
  await createOrEditDiscordMessage(
    discordClient,
    STAFF_RAID_CHANNEL_ID,
    messageTag,
    message,
  );
}
