/* eslint-disable no-console */
import { createClient } from "./discord/create-client";
import { ENCOUNTER_HANDLERS } from "./discord/raidassign.command";
import { Database } from "./exports/mem-database";
import { refreshDatabase } from "./exports/utils";
import { tryAdvertiseMissingSoftReserves } from "./flows/raid-assignments/advertise-missing-softreserves";
import { getRosterFromRaidEvent } from "./flows/roster-helper";
import { fetchEvent } from "./integrations/raid-helper/raid-helper-client";
import { createSheetClient } from "./integrations/sheets/config";

async function main() {
  const client = await createClient();
  const encounter = "raid";
  const database = new Database();
  await refreshDatabase(database);

  const getAssignmentForEncounter = ENCOUNTER_HANDLERS[encounter];
  if (!getAssignmentForEncounter) {
    return;
  }

  const eventId = "1324107615948636256";
  if (eventId === null) {
    return;
  }

  const event = await fetchEvent(eventId);
  if (!event) {
    return;
  }

  const roster = await getRosterFromRaidEvent(event, database);
  await tryAdvertiseMissingSoftReserves(
    client,
    createSheetClient(),
    event,
    roster,
  );

  console.log(roster);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main().catch((err) => console.error(err));
