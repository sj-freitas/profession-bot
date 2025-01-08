/* eslint-disable no-console */
import { ENCOUNTER_HANDLERS } from "./discord/raidassign.command";
import { Database } from "./exports/mem-database";
import { refreshDatabase } from "./exports/utils";
import { updateWorldBuffHistory } from "./flows/update-wb-history/recurring-job";
import { fetchEvent } from "./integrations/raid-helper/raid-helper-client";
import { createSheetClient } from "./integrations/sheets/config";

async function main() {
  const encounter = "raid";
  const sheetClient = createSheetClient();
  const database = new Database();
  await refreshDatabase(database);

  const getAssignmentForEncounter = ENCOUNTER_HANDLERS[encounter];
  if (!getAssignmentForEncounter) {
    return;
  }

  const eventId = "1325581857605287986";
  if (eventId === null) {
    return;
  }

  const event = await fetchEvent(eventId);
  if (!event) {
    return;
  }

  await updateWorldBuffHistory(sheetClient, database, event);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main().catch((err) => console.error(err));
