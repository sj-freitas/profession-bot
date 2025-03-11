/* eslint-disable no-console */
import { getGenericRaidAssignment } from "./classic-wow/raids/generic";
import { TEMPLE_OF_AHNQIRAJ } from "./classic-wow/raids/temple-of-aq/temple-of-aq-mapping";
import { createClient } from "./discord/create-client";
import { Database } from "./exports/mem-database";
import { refreshDatabase } from "./exports/utils";
import {
  getRosterFromRaidEvent,
  toRaidAssignmentRoster,
} from "./flows/roster-helper";
import { fetchEvent } from "./integrations/raid-helper/raid-helper-client";

const MY_DISCORD_ID = "373190463080890378";

async function main() {
  const discordClient = await createClient();
  const database = new Database();
  await refreshDatabase(database);

  const raidEvent = await fetchEvent("1345874138467799164");
  if (!raidEvent) {
    return;
  }
  const roster = await getRosterFromRaidEvent(raidEvent, database);
  const assignmentRoster = toRaidAssignmentRoster(roster);

  const allAssignments = await Promise.all(
    TEMPLE_OF_AHNQIRAJ.assignmentMakers.map(async (assignmentMaker) =>
      assignmentMaker(assignmentRoster),
    ),
  );
  const genericAssignment = await getGenericRaidAssignment(assignmentRoster);
  try {
    const user = await discordClient.users.fetch(MY_DISCORD_ID);
    if (!user) {
      return;
    }

    for (const curr of genericAssignment.dmAssignment) {
      await user.send({
        content: curr,
      });
    }

    for (const currBoss of allAssignments) {
      for (const curr of currBoss.dmAssignment) {
        await user.send({
          content: curr,
        });
      }
      if ((currBoss.files?.length ?? 0) > 0) {
        await user.send({
          content: "### Images:",
          files: currBoss.files,
        });
      }
    }
  } finally {
    await discordClient.destroy();
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main().catch((err) => console.error(err));
