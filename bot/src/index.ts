/* eslint-disable no-console */
// import { createClient } from "./discord/create-client";
import { fetchEvent } from "./integrations/raid-helper/raid-helper-client";
import { Database } from "./exports/mem-database";
import { refreshDatabase } from "./exports/utils";
import { getAssignmentConfigAndHistory } from "./flows/raid-assignments/world-buff-assignments";

async function main() {
  const database = new Database();
  const raidEvent = await fetchEvent("1341056665361059841");
  if (!raidEvent) {
    return;
  }

  await refreshDatabase(database);
  
  getAssignmentConfigAndHistory(database);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main().catch((err) => console.error(err));
