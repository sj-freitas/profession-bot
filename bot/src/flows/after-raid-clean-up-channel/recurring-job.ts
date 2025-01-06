import { Client, TextChannel } from "discord.js";
import { fetchEvent } from "../../integrations/raid-helper/raid-helper-client";
import { RaidEvent } from "../../integrations/raid-helper/types";

const RAID_HELPER_AUTHOR = "579155972115660803";

async function tryCleanUpEvent(): Promise<void> {
  // discordClient: Client,
  // raidEvent: RaidEvent,
  // Back up buff history - maybe fetch this from staff channel (?)
  // Delete all messages
  // Create new event (?)
}

export async function cleanUpAfterEvents(
  discordClient: Client,
  channelIds: string[],
): Promise<void> {
  // Get Raid Events of channel
  const channels = (
    await Promise.all(
      channelIds.map(async (currChannelId) =>
        discordClient.channels.fetch(currChannelId),
      ),
    )
  ).filter(
    (channel): channel is TextChannel =>
      channel !== null && channel.isTextBased(),
  );

  const raidEvents = (
    await Promise.all(channels.map(async (t) => t.messages.fetch()))
  )
    .map((t) =>
      t.filter((x) => x.author.id === RAID_HELPER_AUTHOR).map((x) => x.id),
    )
    .flatMap((t) => t);

  const allRaidEvents = (
    await Promise.all(raidEvents.map((t) => fetchEvent(t)))
  ).filter((t): t is RaidEvent => t !== null);

  await Promise.all(allRaidEvents.map(async () => tryCleanUpEvent()));
}
