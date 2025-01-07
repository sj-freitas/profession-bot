/* eslint-disable no-console */

import { createClient } from "./discord/create-client";
import { pollChannelsForSoftReserves } from "./flows/soft-reserves/recurring-job";

async function main() {
  const discordClient = await createClient();

  await pollChannelsForSoftReserves(discordClient, ["1289209696263077918"]);

  await discordClient.destroy();
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main().catch((err) => console.error(err));
