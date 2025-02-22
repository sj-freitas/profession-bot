/* eslint-disable no-console */
// import { createClient } from "./discord/create-client";
import { fetchEvent } from "./integrations/raid-helper/raid-helper-client";
import { Database } from "./exports/mem-database";
import {
  getRosterFromRaidEvent,
  toRaidAssignmentRoster,
} from "./flows/roster-helper";
import { refreshRoster } from "./exports/utils";
import { getFourHorsemenAssignmentAssignment } from "./classic-wow/raids/naxxramas/four-horsemen";
import { createClient } from "./discord/create-client";

async function main() {
  const discordClient = await createClient();
  const database = new Database();
  const raidEvent = await fetchEvent("1341056665361059841");
  if (!raidEvent) {
    return;
  }

  await refreshRoster(database);

  const roster = await getRosterFromRaidEvent(raidEvent, database);
  const raidAssignmentRoster = toRaidAssignmentRoster(roster);

  const stuff = await getFourHorsemenAssignmentAssignment(raidAssignmentRoster);

  console.log(stuff.dmAssignment);
  
  const user = await discordClient.users.fetch("373190463080890378");
  if (!user) {
    return;
  }
  await user.send({
    content: stuff.dmAssignment.join("\n"),
    files: stuff.files,
  })

  await discordClient.destroy();
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main().catch((err) => console.error(err));
