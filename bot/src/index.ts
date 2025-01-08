/* eslint-disable no-console */
import { ENCOUNTER_HANDLERS } from "./discord/raidassign.command";
import { Database } from "./exports/mem-database";
import { refreshDatabase } from "./exports/utils";
import { getRosterFromRaidEvent } from "./flows/roster-helper";
import { fetchEvent } from "./integrations/raid-helper/raid-helper-client";

async function main() {
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

  console.log(roster);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main().catch((err) => console.error(err));
