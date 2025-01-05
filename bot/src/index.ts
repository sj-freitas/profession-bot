/* eslint-disable no-console */
import { CONFIG } from "./config";
import { createClient } from "./discord/create-client";
import { Database } from "./exports/mem-database";
import { refreshDatabase } from "./exports/utils";
import { pollChannelForWorldBuffAssignments } from "./flows/raid-assignments/recurring-jobs";
import { fetchEvent } from "./integrations/raid-helper/raid-helper-client";
import { createSheetClient } from "./integrations/sheets/config";
import { RaidInfoTable } from "./integrations/sheets/raid-info";

const EVENT_ID = "1323050296871489626";
const { INFO_SHEET } = CONFIG.GUILD;

async function main() {
  const discordClient = await createClient();
  const sheetClient = createSheetClient();
  const database = new Database();
  const raidInfoTable = new RaidInfoTable(sheetClient, INFO_SHEET);
  await refreshDatabase(database);

  const raidEvent = await fetchEvent(EVENT_ID);
  if (!raidEvent) {
    return;
  }
  const raidInfo = await raidInfoTable.getValueById(EVENT_ID);
  if (!raidInfo) {
    return;
  }

  await pollChannelForWorldBuffAssignments(
    discordClient,
    sheetClient,
    raidInfoTable,
    database,
    raidInfo,
  );

  await discordClient.destroy();
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main().catch((err) => console.error(err));
