/* eslint-disable no-console */
import { createClient } from "./discord/create-client";
import { tryUpdateSwitcherPost } from "./flows/switcher-config/recurring-job";
import { createSheetClient } from "./integrations/sheets/config";

async function main() {
  const discordClient = await createClient();
  await tryUpdateSwitcherPost(discordClient, createSheetClient());

  await discordClient.destroy();
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main().catch((err) => console.error(err));
