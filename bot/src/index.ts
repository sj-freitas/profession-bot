/* eslint-disable no-console */
import { createClient } from "./discord/create-client";
import { automaticFlushOfDiscordRoles } from "./flows/auto-flush-roles/recurring-job";
import { createSheetClient } from "./integrations/sheets/config";

async function main() {
  const client = await createClient();
  await automaticFlushOfDiscordRoles(client, createSheetClient());

  console.log("Updated all users!");
  await client.destroy();
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main().catch((err) => console.error(err));
