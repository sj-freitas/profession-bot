/* eslint-disable no-console */
import { Database } from "../exports/mem-database";
import { CommandHandler } from "./commandHandler";
import { deleteAllMessagesInChannel } from "./utils";

const OFFICER_ROLE = "Staff";

export const deleteMessagesHandler: CommandHandler<Database> = async ({
  interaction,
  reply,
}): Promise<void> => {
  const { channel, member } = interaction;

  if (!channel || !channel.isTextBased() || !member?.roles) {
    await reply("Invalid channel");
    return;
  }

  const roles = Array.isArray(member.roles) ? member.roles : [];

  if (roles.find((t) => t !== OFFICER_ROLE)) {
    await reply("User doesn't have required role");
  }

  // Analytics for here
  await deleteAllMessagesInChannel(interaction.client, channel.id);
  await reply("All clear!");
};
