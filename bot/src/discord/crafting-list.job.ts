import { Client } from "discord.js";
import { createSheetClient } from "../integrations/sheets/config";
import { readProfessionData } from "../integrations/sheets/parse-prof";
import { CONFIG } from "../config";
import { getGuildInfo } from "../exports/wowHeadIntegration";
import { toMarkdown } from "../exports/markdown";
import { deleteAllMessagesInChannel, sendMessageToChannel } from "./utils";
import { replaceValueInGoogleSheet } from "../integrations/sheets/utils";

function splitByLines(text: string, numberOfLines: number): string[] {
  const lines = text.split("\n");

  return new Array(Math.ceil(lines.length / numberOfLines))
    .fill("")
    .map((_, index) =>
      lines
        .slice(index * numberOfLines, numberOfLines + index * numberOfLines)
        .join("\n"),
    );
}

const NUMBER_OF_LINES_PER_POST = 10;
const RESPONSE_SHEET = "Responses";
const CRAFTING_CHANNEL_ID = "1318686305609056346";

// Need to create the two flows as two different run modes
export async function runJob(discordClient: Client) {
  const sheetClient = createSheetClient();
  const data = await readProfessionData(sheetClient, CONFIG.GUILD.INFO_SHEET);

  const rowCount = data.cachedRowCount;
  const parsed = await getGuildInfo(data.professionData);

  if (rowCount === data.professionData.length) {
    // Nothing to update
    return;
  }

  // Update the sheet with the current row count
  await replaceValueInGoogleSheet(
    sheetClient,
    CONFIG.GUILD.INFO_SHEET,
    RESPONSE_SHEET,
    { x: "G", y: 2 },
    [`${data.professionData.length}`],
  );

  // Update the list
  const markdown = toMarkdown(parsed);
  // Split this message into several segments
  const segments = splitByLines(markdown, NUMBER_OF_LINES_PER_POST);

  // Delete and update the list
  await deleteAllMessagesInChannel(discordClient, CRAFTING_CHANNEL_ID);
  for (const currChunk of segments) {
    await sendMessageToChannel(discordClient, CRAFTING_CHANNEL_ID, currChunk);
  }
}
