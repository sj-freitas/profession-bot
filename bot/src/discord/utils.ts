import { Client, MessageFlags, TextChannel } from "discord.js";

export function parseDiscordHandles(handles: string): string[] {
  return handles
    .split("@")
    .filter((t) => Boolean(t))
    .map((t) => `@${t.trim()}`);
}

export async function deleteAllMessagesInChannel(
  discordClient: Client,
  channelId: string,
): Promise<void> {
  const channel = await discordClient.channels.fetch(channelId);

  if (!channel) {
    return;
  }
  if (!channel.isTextBased()) {
    return;
  }

  const textChannel = channel as TextChannel;
  const allMessages = await channel.messages.fetch();

  await textChannel.bulkDelete(allMessages);
}

export async function sendMessageToChannel(
  discordClient: Client,
  channelId: string,
  message: string,
): Promise<void> {
  const channel = await discordClient.channels.fetch(channelId);

  if (!channel) {
    return;
  }
  if (!channel.isTextBased() || !channel.isSendable()) {
    return;
  }

  await channel.send({
    content: message,
    flags: MessageFlags.SuppressEmbeds,
  });
}
