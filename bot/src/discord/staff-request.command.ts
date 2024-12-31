/* eslint-disable no-console */
import { Database } from "../exports/mem-database";
import { CommandHandler } from "./commandHandler";

export const staffRequestHandler: CommandHandler<Database> = async ({
  sendDirectMessageToUser,
  sendMessageToChannel,
  reply,
  options,
  author,
}): Promise<void> => {
  const message = options.getString("message");

  if (message === null) {
    await reply("Failed to provide a valid message.");
    return;
  }

  const channelId = "1323265459230867497";
  await sendMessageToChannel(channelId, message);

  console.log(`Author = ${author?.username}`);

  if (!author) {
    await reply("Failed to provide a valid author.");
    return;
  }

  await sendDirectMessageToUser(author.username, message)
};
