import { Client } from "discord.js";
import { CONFIG } from "../../config";
import { fetchServerEvents } from "../../integrations/raid-helper/raid-helper-client";
import { createAndAdvertiseSoftres } from "./create-softres";

const RAID_HELPER_BOT_ID = "579155972115660803";

export async function handleRaidCreatedEvent(
  discordClient: Client,
  channelId: string,
  officerChannelId?: string,
): Promise<void> {
  const events = await fetchServerEvents(CONFIG.GUILD.DISCORD_SERVER_ID);
  if (events === null) {
    return;
  }

  const raidOfChannel = (events.postedEvents ?? []).find(
    (t) => t.channelId === channelId,
  );
  const description = raidOfChannel?.description?.toLowerCase();
  if (!raidOfChannel || !description) {
    // No raid, nothing to do.
    return;
  }

  await createAndAdvertiseSoftres(
    discordClient,
    raidOfChannel,
    officerChannelId,
  );
}

export function addChannelListener(
  client: Client,
  raidSignUpChannels: string[],
  officerChannelId?: string,
) {
  const channelSet = new Set(raidSignUpChannels);
  client.on("messageCreate", (event) => {
    if (!channelSet.has(event.channel.id)) {
      return;
    }
    if (event.author.id !== RAID_HELPER_BOT_ID) {
      return;
    }

    void handleRaidCreatedEvent(
      event.client,
      event.channel.id,
      officerChannelId,
    );
  });
}
