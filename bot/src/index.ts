/* eslint-disable no-console */
import { CONFIG } from "./config";
import { createClient } from "./discord/create-client";
import { Database } from "./exports/mem-database";
import { refreshDatabase } from "./exports/utils";
import { pollChannelForDmAssignments } from "./flows/automated-assignment-dms/recurring-jobs";
import { fetchEvent } from "./integrations/raid-helper/raid-helper-client";
import { createSheetClient } from "./integrations/sheets/config";
import { RaidInfoTable } from "./integrations/sheets/raid-info";

// const MY_DISCORD_ID = "373190463080890378";

async function main() {
  const discordClient = await createClient();
  const database = new Database();
  await refreshDatabase(database);

  const raidEvent = await fetchEvent("1356006115392880911");
  if (!raidEvent) {
    return;
  }
  // const roster = await getRosterFromRaidEvent(raidEvent, database);
  // const assignmentRoster = toRaidAssignmentRoster(roster);

  // const allAssignments = await Promise.all(
  //   NAXXRAMAS.assignmentMakers.map(async (assignmentMaker) =>
  //     assignmentMaker(assignmentRoster),
  //   ),
  // );
  // const genericAssignment = await getGenericRaidAssignment(assignmentRoster);
  // makeAssignments(assignmentRoster);

  const lel = new RaidInfoTable(createSheetClient(), CONFIG.GUILD.INFO_SHEET);
  const raidInfo = await lel.getValueById(raidEvent.id);
  if (!raidInfo) {
    return;
  }

  await pollChannelForDmAssignments(
    discordClient,
    createSheetClient(),
    new RaidInfoTable(createSheetClient(), CONFIG.GUILD.INFO_SHEET),
    database,
    raidInfo,
  );
  // try {
  //   const user = await discordClient.users.fetch(MY_DISCORD_ID);
  //   if (!user) {
  //     return;
  //   }

  //   for (const curr of genericAssignment.dmAssignment) {
  //     await user.send({
  //       content: curr,
  //     });
  //   }

  //   for (const currBoss of allAssignments) {
  //     for (const curr of currBoss.dmAssignment) {
  //       await user.send({
  //         content: curr,
  //       });
  //     }
  //     if ((currBoss.files?.length ?? 0) > 0) {
  //       await user.send({
  //         content: "### Images:",
  //         files: currBoss.files,
  //       });
  //     }
  //   }
  // } finally {
  //   await discordClient.destroy();
  // }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main().catch((err) => console.error(err));
