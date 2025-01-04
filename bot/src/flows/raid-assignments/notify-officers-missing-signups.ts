import { Client } from "discord.js";
import { Database } from "../../exports/mem-database";
import { CONFIG } from "../../config";
import { getRosterFromRaidEvent } from "../roster-helper";
import {
  findMessageInHistory,
  sendMessageToChannel,
} from "../../discord/utils";
import { Player } from "../../integrations/sheets/get-players";
import { RaidEvent } from "../../integrations/raid-helper/types";
import { isRaidEventInAmountOfTime } from "../time-utils";

const { RAIDER_ROLES, DISCORD_SERVER_ID, STAFF_RAID_CHANNEL_ID } = CONFIG.GUILD;
const raiderRolesSet = new Set(RAIDER_ROLES);

const THREE_DAYS_BEFORE_RAID = 3 * 24 * 60 * 60 * 1000;

export async function tryNotifyOfficersMissingSignUps(
  discordClient: Client,
  database: Database,
  raidEvent: RaidEvent,
): Promise<void> {
  // Check if it's 3 days before the raid
  if (!isRaidEventInAmountOfTime(raidEvent, THREE_DAYS_BEFORE_RAID)) {
    return;
  }

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

  const roles = await Promise.all(
    RAIDER_ROLES.map(async (roleId) => guild.roles.fetch(roleId)),
  );
  const raidMarkdownLink = `[${raidEvent.id}](https://discord.com/channels/${DISCORD_SERVER_ID}/${raidEvent.channelId}/${raidEvent.id})`;
  const formatted = `### Missing sign-ups for raid ${raidMarkdownLink} ${raidEvent.title}
This is a list of players registered as ${roles.map((t) => t?.name).join(" or ")} that haven't signed-up yet.
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
