/* eslint-disable no-console */
import { CONFIG } from "../config";
import { createSheetClient } from "../integrations/sheets/config";
import {
  getAllBuffHistory,
  getWorldBuffInfo,
} from "../integrations/sheets/get-buffers";
import { readProfessionData } from "../integrations/sheets/parse-prof";
import { PlayerInfoTable } from "../integrations/sheets/player-info-table";
import { SwitcherRoleDataTable } from "../integrations/sheets/switcher-role-data";
import { Database, toFlattenData } from "./mem-database";
import { getGuildInfo } from "./wowHeadIntegration";

export async function refreshDatabase(database: Database): Promise<void> {
  console.log("Database refresh started.");

  const sheetClient = createSheetClient();
  const playerInfoTable = new PlayerInfoTable(
    sheetClient,
    CONFIG.GUILD.INFO_SHEET,
  );
  const switcherDataTable = new SwitcherRoleDataTable(
    sheetClient,
    CONFIG.GUILD.INFO_SHEET,
  );
  const data = await readProfessionData(sheetClient, CONFIG.GUILD.INFO_SHEET);
  const parsed = await getGuildInfo(data.professionData);
  const roster = await playerInfoTable.getAllValues();
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

  database.setAllRecipes(toFlattenData(parsed));
  database.setPlayersRoster(roster);
  database.setWorldBuffAssignments(worldBuffAssignments);
  database.setWorldBuffHistory(worldBuffHistory);
  database.setSwitchers(switchers);

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
