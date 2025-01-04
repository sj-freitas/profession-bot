/* eslint-disable no-console */
import { CONFIG } from "../config";
import { createSheetClient } from "../integrations/sheets/config";
import {
  getAllBuffHistory,
  getWorldBuffInfo,
} from "../integrations/sheets/get-buffers";
import { getPlayers } from "../integrations/sheets/get-players";
import { readProfessionData } from "../integrations/sheets/parse-prof";
import { Database, toFlattenData } from "./mem-database";
import { getGuildInfo } from "./wowHeadIntegration";

export async function refreshDatabase(database: Database): Promise<void> {
  console.log("Database refresh started.");

  const sheetClient = createSheetClient();
  const data = await readProfessionData(sheetClient, CONFIG.GUILD.INFO_SHEET);
  const parsed = await getGuildInfo(data.professionData);
  const roster = await getPlayers(sheetClient, CONFIG.GUILD.INFO_SHEET);
  const worldBuffAssignments = await getWorldBuffInfo(
    sheetClient,
    CONFIG.GUILD.INFO_SHEET,
  );
  const worldBuffHistory = await getAllBuffHistory(
    sheetClient,
    CONFIG.GUILD.INFO_SHEET,
    worldBuffAssignments,
  );

  database.setAllRecipes(toFlattenData(parsed));
  database.setPlayersRoster(roster);
  database.setWorldBuffAssignments(worldBuffAssignments);
  database.setWorldBuffHistory(worldBuffHistory);

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
