/* eslint-disable no-console */
// import { createClient } from "./discord/create-client";
import { fetchEvent } from "./integrations/raid-helper/raid-helper-client";
import { Database } from "./exports/mem-database";
import {
  getRosterFromRaidEvent,
  toRaidAssignmentRoster,
} from "./flows/roster-helper";
import { refreshRoster } from "./exports/utils";
import { getLoathebAssignment } from "./classic-wow/raids/naxxramas/loatheb";

async function main() {
  const database = new Database();
  const raidEvent = await fetchEvent("1339627114521034803");
  if (!raidEvent) {
    return;
  }

  await refreshRoster(database);

  const roster = await getRosterFromRaidEvent(raidEvent, database);
  const raidAssignmentRoster = toRaidAssignmentRoster(roster);

  const stuff = await getLoathebAssignment(raidAssignmentRoster);

  console.log(stuff.officerAssignment);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main().catch((err) => console.error(err));
