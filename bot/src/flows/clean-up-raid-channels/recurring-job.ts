/* eslint-disable no-console */
import { Client, Message, TextChannel } from "discord.js";

const AUTHORS_TO_PRESERVE: string[] = [
  "579155972115660803", // Raid Helper
  "1318858960274591754", // Own Bot
];

/**
 * Will not delete bot messages or messages that are pinned.
 */
export function shouldBeDeleted(message: Message): boolean {
  const { author } = message;
  if (AUTHORS_TO_PRESERVE.some((botAuthorId) => botAuthorId === author.id)) {
    return false;
  }
  return !message.pinned;
}

/**
 * Between two and three am, it deletes all messages not authored by the bots or
 * staff members,
 *
 * @param discordClient Discord Client to read and delete messages from.
 * @param channelIds ChannelIds to scrape.
 */
export async function cleanUpRaidChannels(
  discordClient: Client,
  channelIds: string[],
): Promise<void> {
  // Every day at 02:00
  if (new Date().getHours() !== 2) {
    return;
  }

  console.log(`It's 2 am, deleting all messages now`);
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

  await Promise.all(
    channels.map(async (channel) => {
      const allMessages = await channel.messages.fetch();
      const messagesToDelete = allMessages.filter((currMessage) =>
        shouldBeDeleted(currMessage),
      );

      await channel.bulkDelete(messagesToDelete);
    }),
  );
}
