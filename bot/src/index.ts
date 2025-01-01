/* eslint-disable no-console */
import { CONFIG } from "./config";
import { createClient } from "./discord/create-client";
import {
  deleteAllMessagesInChannel,
  sendMessageToChannel,
} from "./discord/utils";
import { toMarkdown } from "./exports/markdown";
import { getGuildInfo } from "./exports/wowHeadIntegration";
import { createSheetClient } from "./sheets/config";
import { readProfessionData } from "./sheets/parse-prof";

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

// Need to create the two flows as two different run modes
async function main() {
  const discordClient = await createClient();
  const sheetClient = createSheetClient();
  const data = await readProfessionData(sheetClient, CONFIG.GUILD.INFO_SHEET);

  const parsed = await getGuildInfo(data.professionData);

  // Now build a beautiful document
  const markdown = toMarkdown(parsed);

  // Split this message into several segments
  const segments = splitByLines(markdown, 15);
  const CRAFTING_CHANNEL_ID = "1318686305609056346";

  await deleteAllMessagesInChannel(discordClient, CRAFTING_CHANNEL_ID);
  for (const currChunk of segments) {
    await sendMessageToChannel(discordClient, CRAFTING_CHANNEL_ID, currChunk);
  }

  console.log(markdown);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main().catch((err) => console.error(err));
