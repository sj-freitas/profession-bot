/* eslint-disable no-console */
import { findNextAssignment } from "./buff-management/find-next-assignment";
import { mapRawAssignmentConfig, mapRawHistory } from "./buff-management/utils";
import { CONFIG } from "./config";
import { formatBuffAssignmentMarkdown } from "./exports/world-buffs/format-buff-assigment-md";
import { formatGroupAssignmentsToMarkdown } from "./exports/world-buffs/format-group-assigments-md";
import { formatGroupsForSheets } from "./exports/world-buffs/format-groups-for-sheets";
import { createSheetClient } from "./sheets/config";
import {
  getAllBuffHistory,
  getWorldBuffInfo,
  NUMBER_OF_GROUPS,
} from "./sheets/get-buffers";
import { getPlayers, Player } from "./sheets/get-players";

const ROSTER: string[] =
  `@sergiofreitas9053  @cer_6356  @aimedsnipe  @_dato  @lutaryon  @tearyn  @bodyuhh  @honingbeij  @verexs  @araselshunai  @yeyyo  @dirk1210  @lindorie1471  @wolffirefrost  @skyr6903  @acebeam  @dougie111  @ynael  @imezia  @aj9695  @frxnchie  @fjordhowl  @silverwhand  @grozox`
    .split(" ")
    .map((t) => t.trim())
    .filter((t) => Boolean(t));

async function main() {
  // Read the table
  const sheetClient = createSheetClient();
  const players = await getPlayers(sheetClient, CONFIG.GUILD.INFO_SHEET);
  const rawAssignmentConfig = await getWorldBuffInfo(
    sheetClient,
    CONFIG.GUILD.INFO_SHEET,
  );
  const rawHistory = await getAllBuffHistory(
    sheetClient,
    CONFIG.GUILD.INFO_SHEET,
    rawAssignmentConfig,
  );

  // Map it to the accepted history format

  const playerMap = new Map(
    players.map((t) => [
      t.discordHandle,
      {
        discordHandle: t.discordHandle,
        characters: t.characters,
      },
    ]),
  );
  const mappedRoster = ROSTER.map((t) => {
    const mapped = playerMap.get(t);
    if (!mapped) {
      console.warn(`Unexpected unknown user ${t}!`);
    }
    return mapped;
  }).filter((t): t is Player => Boolean(t));
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

  // Three inputs
  // 1. Group A/B assignment markdown
  // 2. Output to copy to google sheet
  // 3. Updated buff list for discord
  console.log(formatBuffAssignmentMarkdown(rawAssignmentConfig));
  console.log("\n\n");
  console.log(
    formatGroupAssignmentsToMarkdown(
      assignment,
      new Map(
        rawAssignmentConfig.map(({ buffInfo }) => [
          buffInfo.shortName,
          buffInfo,
        ]),
      ),
    ),
  );
  console.log("\n\n");
  console.log(formatGroupsForSheets(assignment, rawAssignmentConfig));
}

main().catch((t: unknown) => console.error(t));
