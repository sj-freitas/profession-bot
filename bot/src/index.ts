/* eslint-disable no-console */
import { createClient } from "./discord/create-client";
import { Database } from "./exports/mem-database";
import { refreshDatabase } from "./exports/utils";
import { tryPostWorldBuffAssignments } from "./flows/raid-assignments/world-buff-assignments";
import { getRosterFromRaidEvent } from "./flows/roster-helper";
import { fetchEvent } from "./integrations/raid-helper/raid-helper-client";

async function main() {
  // eslint-disable-next-line no-undef
  const raidEvent = await fetchEvent("1324107615948636256");
  if (!raidEvent) {
    return;
  }

  const discordClient = await createClient();
  const database = new Database();
  await refreshDatabase(database)
  const roster = await getRosterFromRaidEvent(raidEvent, database);
  await tryPostWorldBuffAssignments(discordClient, database, raidEvent, roster);

  await discordClient.destroy();
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main().catch((err) => console.error(err));
