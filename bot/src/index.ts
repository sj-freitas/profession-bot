/* eslint-disable no-console */
import { CONFIG } from "./config";
import { getRosterFromRaidEvent } from "./flows/roster-helper";
import { fetchEvent } from "./integrations/raid-helper/raid-helper-client";
import { createSheetClient } from "./integrations/sheets/config";
import { Player } from "./integrations/sheets/get-players";
import { RaidInfoTable } from "./integrations/sheets/raid-info";
import { SoftresRaidDataTable } from "./integrations/sheets/softres-raid-data";
import { getRaid } from "./integrations/softres/softres-client";

const { INFO_SHEET } = CONFIG.GUILD;

function hasPlayerSoftReserved(
  player: Player,
  softReservedCharacters: string[],
): boolean {
  return Boolean(
    player.characters.find((t) => softReservedCharacters.indexOf(t) >= 0),
  );
}

async function main() {
  const DEBUG_EVENT_ID = "1323050296871489626";
  const sheetClient = createSheetClient();
  // const client = await createClient();
  // const database = new Database();
  // await refreshDatabase(database);

  const softResInfoTable = new SoftresRaidDataTable(sheetClient, INFO_SHEET);
  const raidInfoTable = new RaidInfoTable(sheetClient, INFO_SHEET);
  const allSoftresRaidInfo = await softResInfoTable.getAllValues();
  const raidInfoEntity = await raidInfoTable.getValueById(DEBUG_EVENT_ID);
  const raidEvent = await fetchEvent(DEBUG_EVENT_ID);

  if (!raidInfoEntity) {
    console.warn("Ups!");
    return;
  }

  // Get the softres ids
  const softResIds = raidInfoEntity?.softresId.split(";");
  const allSoftReserves = await Promise.all(
    softResIds.map(async (currId) => getRaid(currId)),
  );

  const allPlayersOfRaid = await getRosterFromRaidEvent(raidEvent);
  for (const curr of allSoftReserves) {
    const charactersThatReserved = curr.reserved.map((t) => t.name);

    // Now find who's missing
    const missing = allPlayersOfRaid.characters.filter(
      (t) => !hasPlayerSoftReserved(t.player, charactersThatReserved),
    );

    // Instead of just getting a boolean maybe find what character people are reserving as ?
    // Is this important? Probably not, but useful for creating the group setup (?)
    // Actually that's a good idea, for the group setup cross reference with softres as the ultimate
    // source of truth with the raid roster to get THE people for that raid then we can use the addon

    // We also need to find if a character is orphan
    // We also need to find if a player has multiple characters on the same raid

    console.log(`## For ${allSoftresRaidInfo.find((t) => t.softresId === curr.instances[0])?.raidName}
The following players haven't soft-reserved yet: ${missing.map((t) => `<@${t.player.discordId}>`).join(", ")}`);
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main().catch((err) => console.error(err));
