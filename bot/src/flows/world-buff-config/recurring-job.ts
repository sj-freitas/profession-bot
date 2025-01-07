import { Client } from "discord.js";
import { SheetClient } from "../../integrations/sheets/config";
import {
  getWorldBuffInfo,
  WorldBuffInfo,
} from "../../integrations/sheets/get-buffers";
import { CONFIG } from "../../config";
import { getPlayers } from "../../integrations/sheets/get-players";
import { WorldBuffPostConfigTable } from "../../integrations/sheets/world-buff-post-config";
import { findMessageInHistoryById } from "../../discord/utils";

const { INFO_SHEET, DISCORD_SERVER_ID } = CONFIG.GUILD;

function capitalizeFirstLetter(word: string): string {
  const [firstLetter, ...rest] = word;

  return `${firstLetter.toUpperCase()}${rest.join("")}`;
}

function getBuffTitle(buffAssignment: WorldBuffInfo) {
  return `${buffAssignment.longName} (${capitalizeFirstLetter(buffAssignment.shortName)})`;
}

export async function tryUpdateWorldBuffItemRotation(
  discordClient: Client,
  sheetClient: SheetClient,
) {
  const worldBuffConfig = await getWorldBuffInfo(sheetClient, INFO_SHEET);
  const playerInfo = await getPlayers(sheetClient, INFO_SHEET);
  const map = new Map(playerInfo.map((t) => [t.discordHandle, t.discordId]));

  const formattedContent = `## World buff assignment list
This list will be constantly updated and can be used as a reference table
Currently we are trialing a way to give people individual responsibility to gather some of these buffs. 

${worldBuffConfig.map((t) => `- **${getBuffTitle(t.buffInfo)}**: ${t.discordHandles.map((handle) => `<@${map.get(handle)}>`).join(" ")}`).join("\n")}`;

  // TODO Create the message if it doesn't exist
  const worldBuffPostConfig = await new WorldBuffPostConfigTable(
    sheetClient,
    INFO_SHEET,
  ).getValueById(DISCORD_SERVER_ID);

  if (!worldBuffPostConfig) {
    return;
  }

  const message = await findMessageInHistoryById(
    discordClient,
    worldBuffPostConfig.channelId,
    worldBuffPostConfig.messageId,
  );

  if (!message) {
    return;
  }

  if (message.content === formattedContent) {
    return;
  }

  await message.edit(formattedContent);
}
