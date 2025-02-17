/* eslint-disable no-console */
// import { createClient } from "./discord/create-client";
import { fetchEvent } from "./integrations/raid-helper/raid-helper-client";
import { refreshDatabase } from "./exports/utils";
import { Database } from "./exports/mem-database";
import { updateWorldBuffHistory } from "./flows/update-wb-history/recurring-job";
import { createSheetClient } from "./integrations/sheets/config";

async function main() {
  const raidEvent = await fetchEvent("1338822038256619592");
  if (!raidEvent) {
    return;
  }

  const database = new Database();
  const sheetClient = createSheetClient();

  await refreshDatabase(database);
  await updateWorldBuffHistory(sheetClient, database, raidEvent);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main().catch((err) => console.error(err));
