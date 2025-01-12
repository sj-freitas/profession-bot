/* eslint-disable no-console */
import { createClient } from "./discord/create-client";
import { Database } from "./exports/mem-database";
import { refreshDatabase } from "./exports/utils";
import { tryPostFightAssignments } from "./flows/raid-assignments/raid-encounter-assignments";
import { getRosterFromRaidEvent } from "./flows/roster-helper";
import { fetchEvent } from "./integrations/raid-helper/raid-helper-client";
import { createSheetClient } from "./integrations/sheets/config";

async function main() {
  const discordClient = await createClient();
  const database = new Database();
  await refreshDatabase(database);

  const raidEvent = await fetchEvent("1325581857605287986");
  if (!raidEvent) {
    return;
  }
  const roster = await getRosterFromRaidEvent(raidEvent, database);
  await tryPostFightAssignments(discordClient, createSheetClient(), raidEvent, roster);

  await discordClient.destroy();
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main().catch((err) => console.error(err));
