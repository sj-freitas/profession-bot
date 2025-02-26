/* eslint-disable no-console */
// import { createClient } from "./discord/create-client";
import { getFaerlinaAssignment } from "./classic-wow/raids/naxxramas/faerlina";
import { createClient } from "./discord/create-client";
import { Database } from "./exports/mem-database";
import { refreshDatabase } from "./exports/utils";
import {
  getRosterFromRaidEvent,
  toRaidAssignmentRoster,
} from "./flows/roster-helper";
import { fetchEvent } from "./integrations/raid-helper/raid-helper-client";

async function main() {
  const discordClient = await createClient();
  const database = new Database();
  await refreshDatabase(database);

  const raidEvent = await fetchEvent("1342004266964877433");
  if (!raidEvent) {
    return;
  }
  const roster = await getRosterFromRaidEvent(raidEvent, database);
  const assignmentRoster = toRaidAssignmentRoster(roster);

  const bossAssignment = await getFaerlinaAssignment(assignmentRoster);

  const user = await discordClient.users.fetch("373190463080890378");
  if (!user) {
    return;
  }

  await user.send({
    content: bossAssignment.dmAssignment.join("\n"),
    files: bossAssignment.files,
  });

  await discordClient.destroy();
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main().catch((err) => console.error(err));
