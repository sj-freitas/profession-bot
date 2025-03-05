/* eslint-disable no-console */
import { CONFIG } from "../config";
import { AtieshCandidatesTable } from "../integrations/sheets/atiesh/atiesh-candidates-data";
import { createSheetClient, SheetClient } from "../integrations/sheets/config";
import {
  getAllBuffHistory,
  getWorldBuffInfo,
} from "../integrations/sheets/get-buffers";
import { readProfessionData } from "../integrations/sheets/parse-prof";
import {
  PlayerInfo,
  PlayerInfoTable,
} from "../integrations/sheets/player-info-table";
import { SwitcherRoleDataTable } from "../integrations/sheets/switcher-role-data";
import { Database, removeDuplicates, toFlattenData } from "./mem-database";
import { getGuildInfo } from "./wowHeadIntegration";

function addAtieshDataToCharacters(
  roster: PlayerInfo[],
  atieshCharacters: string[],
): PlayerInfo[] {
  const atieshCharactersSet = new Set(atieshCharacters);

  return roster.map((x) => {
    const charactersOfPlayer = [...x.altNames, x.mainName];

    return {
      ...x,
      atieshCharacters: charactersOfPlayer.filter((t) =>
        atieshCharactersSet.has(t),
      ),
    };
  });
}

export async function refreshRoster(
  database: Database,
  sheetClient: SheetClient = createSheetClient(),
): Promise<void> {
  const playerInfoTable = new PlayerInfoTable(
    sheetClient,
    CONFIG.GUILD.INFO_SHEET,
  );
  const roster = await playerInfoTable.getAllValues();
  const atieshCandidatesInfo = new AtieshCandidatesTable(
    sheetClient,
    CONFIG.GUILD.INFO_SHEET,
  );
  const atieshCandidates = await atieshCandidatesInfo.getAllValues();
  const decoratedRoster = addAtieshDataToCharacters(
    roster,
    atieshCandidates
      .filter((t) => t.atieshStatus === "Completed")
      .map((t) => t.characterName),
  );

  database.setPlayersRoster(decoratedRoster);
}

export async function refreshDatabase(database: Database): Promise<void> {
  console.log("Database refresh started.");

  const sheetClient = createSheetClient();
  const switcherDataTable = new SwitcherRoleDataTable(
    sheetClient,
    CONFIG.GUILD.INFO_SHEET,
  );
  const data = await readProfessionData(sheetClient, CONFIG.GUILD.INFO_SHEET);
  const parsed = await getGuildInfo(data.professionData);

  const worldBuffAssignments = await getWorldBuffInfo(
    sheetClient,
    CONFIG.GUILD.INFO_SHEET,
  );
  const worldBuffHistory = await getAllBuffHistory(
    sheetClient,
    CONFIG.GUILD.INFO_SHEET,
    worldBuffAssignments,
  );
  const switchers = await switcherDataTable.getAllValues();

  database.setAllRecipes(removeDuplicates(toFlattenData(parsed)));
  database.setWorldBuffAssignments(worldBuffAssignments);
  database.setWorldBuffHistory(worldBuffHistory);
  database.setSwitchers(switchers);

  await refreshRoster(database, sheetClient);

  console.log("Database refresh complete.");
}

export async function loop(
  callback: () => Promise<void>,
  intervalInMs: number,
) {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    await callback();
    await new Promise((resolve) => {
      setTimeout(resolve, intervalInMs);
    });
  }
}
