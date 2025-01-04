/* eslint-disable no-console */
import { CONFIG } from "./config";
import { createClient } from "./discord/create-client";
import { loop, refreshDatabase } from "./exports/utils";
import { addChannelListener } from "./flows/soft-reserves/channel-listener";
import { pollChannelsForAssignments } from "./flows/raid-assignments/recurring-jobs";
import { Database } from "./exports/mem-database";

// Need to create the two flows as two different run modes
async function main() {
  const database = new Database();
  await refreshDatabase(database);

  const raidChannels = CONFIG.GUILD.RAID_SIGN_UP_CHANNELS;
  const officerChannel = CONFIG.GUILD.STAFF_RAID_CHANNEL_ID;
  const client = await createClient((discordClient) => {
    addChannelListener(discordClient, raidChannels, officerChannel);
  });

  // Create Recurring Job
  void loop(
    async () => pollChannelsForAssignments(client, database, raidChannels),
    60000,
  );
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main().catch((err) => console.error(err));
