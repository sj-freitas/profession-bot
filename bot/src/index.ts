/* eslint-disable no-console */
import { AttachmentBuilder, MessageFlags } from "discord.js";
import { CONFIG } from "./config";
import { createClient } from "./discord/create-client";
import { drawImageAssignments } from "./classic-wow/raids/naxxramas/kel-thuzad-images";
import { getRosterFromRaidEvent, toRaidAssignmentRoster } from "./flows/roster-helper";
import { refreshDatabase } from "./exports/utils";
import { Database } from "./exports/mem-database";
import { fetchEvent } from "./integrations/raid-helper/raid-helper-client";
import { makeAssignments } from "./classic-wow/raids/naxxramas/kel-thuzad";


async function main() {
  const discordClient = await createClient();

  const guild = await discordClient.guilds.fetch(CONFIG.GUILD.DISCORD_SERVER_ID);
  const myProfile = await guild.members.fetch("373190463080890378");
  
  // Naxxramas raid
  const database = new Database();
  await refreshDatabase(database);
  const raidEvent = await fetchEvent("1335889878726213675");
  if (!raidEvent) {
    return;
  }

  const roster = await getRosterFromRaidEvent(raidEvent, database);
  const raidAssignmentRoster = toRaidAssignmentRoster(roster);
  const assignments = makeAssignments(raidAssignmentRoster.characters);
  const groups = assignments.map((t) => t.assignments[0].characters.map((x) => x.name));
  const file = await drawImageAssignments(groups);
  
  await myProfile.send({
    content: `Kel'Thuzad`,
    files: [new AttachmentBuilder(file, { name: "kel-thuzad-assignments.png" })],
    flags: MessageFlags.SuppressEmbeds,
  });

  await discordClient.destroy();
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main().catch((err) => console.error(err));
