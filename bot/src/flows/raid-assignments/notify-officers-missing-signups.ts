import { Client, GuildMember } from "discord.js";
import { Database } from "../../exports/mem-database";
import { CONFIG } from "../../config";
import { getRosterFromRaidEvent } from "../roster-helper";
import {
  fetchMemberOrNull,
  findMessageOfBotInHistory,
  sendMessageToChannel,
} from "../../discord/utils";
import { RaidEvent } from "../../integrations/raid-helper/types";
import { isRaidEventInAmountOfTime } from "../time-utils";
import { PlayerInfo } from "../../integrations/sheets/player-info-table";

const { RAIDER_ROLES, DISCORD_SERVER_ID, STAFF_RAID_CHANNEL_ID } = CONFIG.GUILD;
const raiderRolesSet = new Set(RAIDER_ROLES);

const THREE_DAYS_BEFORE_RAID = 3 * 24 * 60 * 60 * 1000;

function getMessageTag(raidEvent: RaidEvent): string {
  const raidMarkdownLink = `[${raidEvent.id}](https://discord.com/channels/${DISCORD_SERVER_ID}/${raidEvent.channelId}/${raidEvent.id})`;
  return `### Missing sign-ups for raid ${raidMarkdownLink}`;
}

export async function officerNotificationMissingSignUpsMessageExists(
  discordClient: Client,
  raidEvent: RaidEvent,
): Promise<boolean> {
  const messageTag = getMessageTag(raidEvent);

  return Boolean(
    await findMessageOfBotInHistory(
      discordClient,
      STAFF_RAID_CHANNEL_ID,
      messageTag,
    ),
  );
}

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
  const players = database.getPlayerInfos();
  const members = await Promise.all(
    players.map(async (t) => fetchMemberOrNull(guild, t.discordId)),
  );
  const guildRaiders = members
    .filter(
      (member: GuildMember | null): member is GuildMember => member !== null,
    )
    .filter((member) => {
      const roles = member.roles.valueOf();

      return roles.find((t) => raiderRolesSet.has(t.id));
    })
    .map((t) => t.id);

  const signUppers = await getRosterFromRaidEvent(raidEvent, database, {
    includeAbsence: true,
    includeBench: true,
    includeLate: true,
    includeTentative: true,
  });
  const signUppersMap = new Set(
    signUppers.characters.map((t) => t.player.discordId),
  );

  const notSignedUpRaiders = guildRaiders.filter((t) => !signUppersMap.has(t));
  const notSignedUpPlayers = notSignedUpRaiders
    .map((raiderId) => players.find((player) => raiderId === player.discordId))
    .filter((t): t is PlayerInfo => t !== undefined);

  const roles = await Promise.all(
    RAIDER_ROLES.map(async (roleId) => guild.roles.fetch(roleId)),
  );
  const formatted = `${getMessageTag(raidEvent)} ${raidEvent.title}
This is a list of players registered as ${roles.map((t) => t?.name).join(" or ")} that haven't signed-up yet.
${notSignedUpPlayers.map((t) => ` - <@${t.discordId}> ${t.mainName}`).join("\n")}`;

  const message = await findMessageOfBotInHistory(
    discordClient,
    STAFF_RAID_CHANNEL_ID,
    getMessageTag(raidEvent),
  );
  if (message !== null) {
    // Edit
    await message.edit(formatted);
  } else {
    // Send
    await sendMessageToChannel(discordClient, STAFF_RAID_CHANNEL_ID, formatted);
  }
}
