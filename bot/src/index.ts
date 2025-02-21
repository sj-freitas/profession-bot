/* eslint-disable no-console */
// import { createClient } from "./discord/create-client";
import { fetchEvent } from "./integrations/raid-helper/raid-helper-client";
import { Database } from "./exports/mem-database";
import {
  getRosterFromRaidEvent,
  toRaidAssignmentRoster,
} from "./flows/roster-helper";
import { refreshRoster } from "./exports/utils";
import { getCthunAssignment } from "./classic-wow/raids/temple-of-aq/cthun";

async function main() {
  const database = new Database();
  const raidEvent = await fetchEvent("1341056665361059841");
  if (!raidEvent) {
    return;
  }

  await refreshRoster(database);

  const roster = await getRosterFromRaidEvent(raidEvent, database);
  const raidAssignmentRoster = toRaidAssignmentRoster(roster);

  const stuff = await getCthunAssignment(raidAssignmentRoster);

  console.log(stuff.announcementAssignment);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main().catch((err) => console.error(err));
