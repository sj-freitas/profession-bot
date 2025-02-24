/* eslint-disable no-console */
// import { createClient } from "./discord/create-client";
import { Database } from "./exports/mem-database";
import { refreshDatabase } from "./exports/utils";
import { pollChannelsForWorldBuffHistory } from "./flows/update-wb-history/recurring-job";

async function main() {
  const database = new Database();

  await refreshDatabase(database);
  await pollChannelsForWorldBuffHistory(database, ["1289209696263077918"]);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main().catch((err) => console.error(err));
