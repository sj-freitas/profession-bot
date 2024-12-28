import { findNextAssignment } from "../buff-management/find-next-assignment";
import {
  mapRawAssignmentConfig,
  mapRawHistory,
} from "../buff-management/utils";
import { Database } from "../exports/mem-database";
import { formatGroupAssignmentsToMarkdown } from "../exports/world-buffs/format-group-assigments-md";
import { formatGroupsForSheets } from "../exports/world-buffs/format-groups-for-sheets";
import { Player } from "../sheets/get-players";
import { CommandHandler, CommandOptions, StringReply } from "./commandHandler";

const NUMBER_OF_GROUPS = 2;

export const worldBuffsHandler: CommandHandler<Database> = async (
  options: CommandOptions,
  reply: StringReply,
  database: Database,
): Promise<void> => {
  const roster = options.getString("roster");

  if (roster === null) {
    await reply("Failed to provide a valid roster.");
    return;
  }

  const parsedRoster = roster
    .split(" ")
    .map((t) => t.trim())
    .filter((t) => Boolean(t))
    .filter((t) => t.startsWith("@"));

  const players = database.getPlayersRoster();
  const rawHistory = database.getWorldBuffHistory();
  const rawAssignmentConfig = database.getWorldBuffAssignments();
  const serverHandleMap = new Map(players.map((t) => [t.serverHandle, t]));
  const mappedRoster = parsedRoster
    .map((t) => serverHandleMap.get(t))
    .filter((t): t is Player => Boolean(t));

  const playerMap = new Map(players.map((t) => [t.discordHandle, t]));

  const history = mapRawHistory(rawHistory, playerMap);
  const assignmentConfig = mapRawAssignmentConfig(
    rawAssignmentConfig,
    playerMap,
  );

  const assignment = findNextAssignment({
    history,
    assignmentConfig,
    roster: mappedRoster,
    numberOfGroups: NUMBER_OF_GROUPS,
  });

  const formatted = formatGroupAssignmentsToMarkdown(
    assignment,
    new Map(
      rawAssignmentConfig.map(({ buffInfo }) => [buffInfo.shortName, buffInfo]),
    ),
  );

  await reply(
    `Please copy paste the following message to the sign up channel:\n\`\`\`${formatted}\`\`\`\n Use the format below to copy&paste on google sheets to save\n${formatGroupsForSheets(assignment, rawAssignmentConfig)}`,
  );
};
