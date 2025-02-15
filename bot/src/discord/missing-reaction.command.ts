/* eslint-disable no-console */
import { Database } from "../exports/mem-database";
import { CommandHandler } from "./commandHandler";

export const getMissingRaiderFromEmojiReaction: CommandHandler<Database> = async ({
  interaction,
  payload,
  reply,
}): Promise<void> => {
  const messageId = interaction.options.getString("message-id");
  if (!messageId) {
    await reply("Please provide a message-id.");
    return;
  }
  const reactionMessage = await interaction.channel?.messages.fetch(messageId);
  if (!reactionMessage) {
    await reply(
      "Please provide a valid message-id - no message was found with the provided id.",
    );
    return;
  }
  const emoji = interaction.options.getString("emoji");
  if (!messageId) {
    await reply("Please provide an emoji.");
    return;
  }

  const reactions = reactionMessage.reactions.cache;
  const emojiReaction = reactions.find((t) => t.emoji.name === emoji);
  if (!emojiReaction) {
    return;
  }

  const users = await emojiReaction.users.fetch();
  const reactionUserIds = users.map((t) => t.id);
  const allRaiderUserIds = payload
    .getPlayerInfos()
    .filter((t) => t.discordRoles.find((x) => x === "Raider"))
    .map((t) => t.discordId);
  
  // Find missing
  const missing = allRaiderUserIds.filter((t) => !reactionUserIds.find((x) => x === t));

  await reply(`## Following players haven't reacted with ${emoji}
${missing.map((t) => ` - <@${t}>`).join("\n")}`)
};
