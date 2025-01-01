import { Client, MessageFlags } from "discord.js";

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

  const allMessages = await channel.messages.fetch();

  await Promise.all(
    allMessages.map(async (currMessage) =>
      channel.messages.delete(currMessage),
    ),
  );
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
