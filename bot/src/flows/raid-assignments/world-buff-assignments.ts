import { Client } from "discord.js";
import { findNextAssignment } from "../../buff-management/find-next-assignment";
import {
  mapRawAssignmentConfig,
  mapRawHistory,
} from "../../buff-management/utils";
import { Database } from "../../exports/mem-database";
import { formatGroupAssignmentsToMarkdown } from "../../exports/world-buffs/format-group-assigments-md";
import { NUMBER_OF_GROUPS } from "../../sheets/get-buffers";
import { Roster } from "../roster-helper";
import { RaidEvent } from "../../raid-helper/types";
import {
  findMessageInHistory,
  sendMessageToChannel,
} from "../../discord/utils";

function getAssignmentConfigAndHistory(database: Database) {
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

export async function tryPostWorldBuffAssignments(
  discordClient: Client,
  database: Database,
  raidEvent: RaidEvent,
  roster: Roster,
): Promise<void> {
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

  // Post or Edit message
  const message = await findMessageInHistory(
    discordClient,
    raidEvent.channelId,
    "# World buff item rotation",
  );
  if (message !== null) {
    // Edit
    await message.edit(formatted);
  } else {
    // Send
    await sendMessageToChannel(discordClient, raidEvent.channelId, formatted);
  }
}
