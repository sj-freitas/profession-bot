/* eslint-disable no-console */
import { v4 as newUuid } from "uuid";
import { Database } from "../exports/mem-database";
import { CommandHandler } from "./commandHandler";
import { createSheetClient } from "../integrations/sheets/config";
import {
  respondToRequestInfo,
  writeRequestInfo,
} from "../integrations/sheets/manage-requests";
import { CONFIG } from "../config";

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
  const anonymous = options.getBoolean("anonymous") ?? true;
  const channelId = CONFIG.GUILD.STAFF_REQUEST_CHANNEL_ID;

  if (!author) {
    await reply("Failed to provide a valid author.");
    return;
  }

  await sendMessageToChannel(
    channelId,
    `[${anonymous ? "Anonymous" : `${`@${author.username}`}`}] requests: \`\`\`
${message}
\`\`\`
to reply type \`/staff-reply ${messageId} <reply text>\`.`,
  );

  await reply(
    "Message sent to the staff team successfully. Someone will be checking it shortly.",
  );

  // Store the message
  const sheetClient = createSheetClient();
  void (await writeRequestInfo(sheetClient, CONFIG.GUILD.INFO_SHEET, {
    messageId,
    author: author.username,
    message,
  }));
};

export const staffReplyHandler: CommandHandler<Database> = async ({
  reply,
  options,
  author,
  sendDirectMessageToUser,
}): Promise<void> => {
  const ticketId = options.getString("ticket-id");
  if (ticketId === null) {
    await reply("Failed to provide a valid ticket-id.");
    return;
  }

  const message = options.getString("message");
  if (message === null) {
    await reply("Failed to provide a valid message.");
    return;
  }

  if (!author) {
    await reply("Failed to provide a valid author.");
    return;
  }

  const sheetClient = createSheetClient();
  const userId = await respondToRequestInfo(
    sheetClient,
    CONFIG.GUILD.INFO_SHEET,
    ticketId,
    {
      staffResponder: author.username,
      reply: message,
    },
  );

  if (userId === null) {
    await reply("An officer has already replied to this message.");
    return;
  }

  await sendDirectMessageToUser(
    userId,
    `Your request was answered by @${author.username}: \`\`\`
${message}
\`\`\`
to reply DM the officer in question or submit another issue.`,
  );

  await reply("A DM in your name has been sent to the requester.");
};
