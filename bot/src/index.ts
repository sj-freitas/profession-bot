/* eslint-disable no-console */
import { CONFIG } from "./config";
import { createClient } from "./discord/create-client";
import { cleanUpRaidChannels } from "./flows/clean-up-raid-channels/recurring-job";

const { RAID_SIGN_UP_CHANNELS } = CONFIG.GUILD;

async function main() {
  const discordClient = await createClient();

  await cleanUpRaidChannels(discordClient, RAID_SIGN_UP_CHANNELS);

  await discordClient.destroy();
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main().catch((err) => console.error(err));
