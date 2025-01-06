import { findNextAssignment } from "../buff-management/find-next-assignment";
import { Database } from "../exports/mem-database";
import { formatGroupAssignmentsToMarkdown } from "../exports/world-buffs/format-group-assigments-md";
import { formatGroupsForSheets } from "../exports/world-buffs/format-groups-for-sheets";
import { getAssignmentConfigAndHistory } from "../flows/raid-assignments/world-buff-assignments";
import { getRosterFromRaidEvent } from "../flows/roster-helper";
import { fetchEvent } from "../integrations/raid-helper/raid-helper-client";
import { CommandHandler } from "./commandHandler";

const NUMBER_OF_GROUPS = 2;

export function a() {}

export const worldBuffsHandler: CommandHandler<Database> = async ({
  options,
  reply,
  payload: database,
}): Promise<void> => {
  const eventId = options.getString("event-id");

  if (eventId === null) {
    await reply("Failed to provide a valid roster.");
    return;
  }
  const event = await fetchEvent(eventId);
  if (!event) {
    await reply(`${eventId} refers to an invalid event.`);
    return;
  }

  const roster = await getRosterFromRaidEvent(event, database);
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
