/* eslint-disable no-console */
// import { createClient } from "./discord/create-client";
import { fetchEvent } from "./integrations/raid-helper/raid-helper-client";
import {
  getRosterFromRaidEvent,
  toRaidAssignmentRoster,
} from "./flows/roster-helper";
import { refreshDatabase } from "./exports/utils";
import { Database } from "./exports/mem-database";
import { getPatchwerkAssignment } from "./classic-wow/raids/naxxramas/patchwerk";

async function main() {
  // const discordClient = await createClient();
  const raidEvent = await fetchEvent("1336973666000437303");
  if (!raidEvent) {
    return;
  }

  const database = new Database();
  await refreshDatabase(database);

  const roster = await getRosterFromRaidEvent(raidEvent, database);
  const raidAssignmentRoster = toRaidAssignmentRoster(roster);

  const kek = await getPatchwerkAssignment(raidAssignmentRoster);

  console.log(kek.officerAssignment);

  // await discordClient.destroy();
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main().catch((err) => console.error(err));
