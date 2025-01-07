import {
  AttachmentBuilder,
  Client,
  Message,
  MessageFlags,
  TextChannel,
} from "discord.js";

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
  files?: AttachmentBuilder[],
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
    files,
    flags: MessageFlags.SuppressEmbeds,
  });
}

export async function findMessageInHistoryById(
  discordClient: Client,
  channelId: string,
  messageId: string,
): Promise<Message<boolean> | null> {
  const channel = await discordClient.channels.fetch(channelId);
  if (!channel || !channel.isTextBased()) {
    return null;
  }

  const messages = await channel.messages.fetch();
  const foundMessage = messages.find((t) => t.id === messageId);
  if (!foundMessage) {
    return null;
  }

  return foundMessage;
}

export async function findMessageOfBotInHistory(
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

/**
 * Creates or Edits an existing message, this is a helper function that avoids having to do several repeated calls
 * instead doing the whole flow in a single function.
 *
 * @param discordClient The discord client to use.
 * @param channelId The channel Id to search the messages for.
 * @param messageTag A segment which indicates the start of the message text, this is how we can identity the message in a channel.
 * @param messageContent The content of the message containing all the text.
 */
export async function createOrEditDiscordMessage(
  discordClient: Client,
  channelId: string,
  messageTag: string,
  messageContent: string,
  files?: AttachmentBuilder[],
): Promise<void> {
  const message = await findMessageOfBotInHistory(
    discordClient,
    channelId,
    messageTag,
  );

  if (message === null) {
    await sendMessageToChannel(discordClient, channelId, messageContent);
    return;
  }

  if (message.content === messageContent) {
    return;
  }

  await message.edit({
    content: messageContent,
    flags: MessageFlags.SuppressEmbeds,
    files,
  });
}
