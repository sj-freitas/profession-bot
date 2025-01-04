import { Client } from "discord.js";
import { RaidEvent } from "../../raid-helper/types";
import { Database } from "../../exports/mem-database";
import { CONFIG } from "../../config";
import { getRosterFromRaidEvent } from "../roster-helper";
import { Player } from "../../sheets/get-players";
import {
  findMessageInHistory,
  sendMessageToChannel,
} from "../../discord/utils";

const { RAIDER_ROLES, DISCORD_SERVER_ID, STAFF_RAID_CHANNEL_ID } = CONFIG.GUILD;
const raiderRolesSet = new Set(RAIDER_ROLES);

export async function tryNotifyOfficersMissingSignUps(
  discordClient: Client,
  database: Database,
  raidEvent: RaidEvent,
): Promise<void> {
  const guild = await discordClient.guilds.fetch(DISCORD_SERVER_ID);

  const players = database.getPlayersRoster();
  const members = await Promise.all(
    players.map(async (t) => guild.members.fetch(t.discordId)),
  );
  const guildRaiders = members
    .filter((member) => {
      const roles = member.roles.valueOf();

      return roles.find((t) => raiderRolesSet.has(t.id));
    })
    .map((t) => t.id);

  const signUppers = await getRosterFromRaidEvent(raidEvent, true);
  const signUppersMap = new Set(
    signUppers.characters.map((t) => t.player.discordId),
  );

  const notSignedUpRaiders = guildRaiders.filter((t) => !signUppersMap.has(t));
  const notSignedUpPlayers = notSignedUpRaiders
    .map((raiderId) => players.find((player) => raiderId === player.discordId))
    .filter((t): t is Player => t !== undefined);

  const raidMarkdownLink = `[${raidEvent.id}](https://discord.com/channels/${DISCORD_SERVER_ID}/${raidEvent.channelId}/${raidEvent.id})`;
  const formatted = `### Missing sign-ups for raid ${raidMarkdownLink} ${raidEvent.title}
${notSignedUpPlayers.map((t) => ` - <@${t.discordId}> ${t.characters[0]}`).join("\n")}`;

  const message = await findMessageInHistory(
    discordClient,
    STAFF_RAID_CHANNEL_ID,
    `### Missing sign-ups for raid ${raidMarkdownLink}`,
  );
  if (message !== null) {
    // Edit
    await message.edit(formatted);
  } else {
    // Send
    await sendMessageToChannel(discordClient, STAFF_RAID_CHANNEL_ID, formatted);
  }
}
