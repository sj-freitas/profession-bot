/* eslint-disable no-console */
import { CONFIG } from "./config";
import { toMarkdown } from "./exports/markdown";
import { getGuildInfo } from "./exports/wowHeadIntegration";
import { createSheetClient } from "./sheets/config";
import { readProfessionData } from "./sheets/parse-prof";

// Need to create the two flows as two different run modes
async function main() {
  const sheetClient = createSheetClient();
  const data = await readProfessionData(sheetClient, CONFIG.GUILD.INFO_SHEET);

  const parsed = await getGuildInfo(data);

  // Now build a beautiful document
  const markdown = toMarkdown(parsed);

  console.log(markdown);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main().catch((err) => console.error(err));
