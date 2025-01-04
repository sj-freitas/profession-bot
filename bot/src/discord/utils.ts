import { Client, Message, MessageFlags, TextChannel } from "discord.js";

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

export async function findMessageInHistory(
  discordClient: Client,
  channelId: string,
  messageStartsWith: string,
): Promise<Message<boolean> | null> {
  const channel = await discordClient.channels.fetch(channelId);
  if (!channel || !channel.isTextBased()) {
    return null;
  }

  const messages = await channel.messages.fetch();
  const messagesOfBot = messages.filter(
    (t) => t.author.id === discordClient.application?.id,
  );
  const foundMessage = messagesOfBot.find(
    (t) => t.content.indexOf(messageStartsWith) === 0,
  );

  if (!foundMessage) {
    return null;
  }

  return foundMessage;
}
