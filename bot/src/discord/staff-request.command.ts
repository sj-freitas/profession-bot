/* eslint-disable no-console */
import { v4 as newUuid } from "uuid";
import { Database } from "../exports/mem-database";
import { CommandHandler } from "./commandHandler";

export const staffRequestHandler: CommandHandler<Database> = async ({
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

  const messageId = newUuid();
  const anonymous = options.getBoolean("anonymous") ?? false;
  const channelId = "1323265459230867497";

  // Store this info on the sheets - might need to check permissions
  // The message id will work as an identifier so that the user keeps being anonymous
  // We don't store or log that info

  if (!author) {
    await reply("Failed to provide a valid author.");
    return;
  }

  await sendMessageToChannel(
    channelId,
    `[${anonymous ? `${`@${author.username}`}` : "Anonymous"}] requests: \`\`\`
${message}
\`\`\`
to reply type \`/staff-reply ${messageId} <reply text>\`.`,
  );
};
