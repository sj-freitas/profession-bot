/* eslint-disable no-console */
import { createClient } from "./discord/create-client";
import { Database } from "./exports/mem-database";
import { refreshDatabase } from "./exports/utils";
import { tryPostRaidComposition } from "./flows/raid-assignments/raid-composition-assignments";
import { tryPostFightAssignments } from "./flows/raid-assignments/raid-encounter-assignments";
import { getRosterFromRaidEvent } from "./flows/roster-helper";
import { fetchEvent } from "./integrations/raid-helper/raid-helper-client";
import { createSheetClient } from "./integrations/sheets/config";

async function main() {
  const discordClient = await createClient();
  const sheetClient = createSheetClient();
  const database = new Database();
  await refreshDatabase(database);

  const raidEvent = await fetchEvent("1323050296871489626");
  if (!raidEvent) {
    return;
  }

  const roster = await getRosterFromRaidEvent(raidEvent, database);

  await tryPostRaidComposition(discordClient, raidEvent, roster);
  await tryPostFightAssignments(discordClient, sheetClient, raidEvent, roster);

  await discordClient.destroy();
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main().catch((err) => console.error(err));
