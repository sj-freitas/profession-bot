/* eslint-disable no-console */
import { CONFIG } from "./config";
import { createClient } from "./discord/create-client";
import { Database } from "./exports/mem-database";
import { refreshDatabase } from "./exports/utils";
import { getRosterFromRaidEvent } from "./flows/roster-helper";
import { fetchEvent } from "./raid-helper/raid-helper-client";
import { Player } from "./sheets/get-players";

const { DISCORD_SERVER_ID } = CONFIG.GUILD;
const RAIDER_ROLE_ID = "1222174196021465200";
const STAFF_ROLE_ID = "1175475456032645250";
const RAIDER_ROLES = new Set([RAIDER_ROLE_ID, STAFF_ROLE_ID]);

async function main() {
  const client = await createClient();
  const database = new Database();
  await refreshDatabase(database);

  const guild = await client.guilds.fetch(DISCORD_SERVER_ID);

  const players = database.getPlayersRoster();
  const members = await Promise.all(
    players.map(async (t) => guild.members.fetch(t.discordId)),
  );
  const guildRaiders = members
    .filter((member) => {
      const roles = member.roles.valueOf();

      return roles.find((t) => RAIDER_ROLES.has(t.id));
    })
    .map((t) => t.id);

  const raidEvent = await fetchEvent("1323050296871489626");
  const signUppers = await getRosterFromRaidEvent(raidEvent, true);
  const signUppersMap = new Set(
    signUppers.characters.map((t) => t.player.discordId),
  );

  const notSignedUpRaiders = guildRaiders.filter((t) => !signUppersMap.has(t));
  const notSignedUpPlayers = notSignedUpRaiders
    .map((raiderId) => players.find((player) => raiderId === player.discordId))
    .filter((t): t is Player => t !== undefined);

  const raidMarkdownLink = `[${raidEvent.id}](https://discord.com/channels/${DISCORD_SERVER_ID}/${raidEvent.channelId}/${raidEvent.id})`;
  const formatted = `## Missing sign-ups for raid ${raidMarkdownLink} ${raidEvent.title}
${notSignedUpPlayers.map((t) => ` - <@${t.discordId}> ${t.characters[0]}`).join("\n")}`;
  console.log(formatted);

  await client.destroy();
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main().catch((err) => console.error(err));
