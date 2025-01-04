/* eslint-disable no-console */
import { CONFIG } from "./config";
import { createClient } from "./discord/create-client";
import { loop, refreshDatabase } from "./exports/utils";
import { Database } from "./exports/mem-database";
import { pollChannelsForSoftReserves } from "./flows/soft-reserves/recurring-job";

async function main() {
  const database = new Database();
  await refreshDatabase(database);

  const raidChannels = CONFIG.GUILD.RAID_SIGN_UP_CHANNELS;
  const officerChannel = CONFIG.GUILD.STAFF_RAID_CHANNEL_ID;
  const client = await createClient();

  // Create Recurring Job
  void loop(
    async () =>
      pollChannelsForSoftReserves(client, raidChannels, officerChannel),
    60000,
  );
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main().catch((err) => console.error(err));
