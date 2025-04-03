import { Client, GuildMember } from "discord.js";
import { CONFIG } from "../../config";
import { createSheetClient } from "../../integrations/sheets/config";
import { PlayerInfoTable } from "../../integrations/sheets/player-info-table";
import { fetchMemberOrNull } from "../../discord/utils";
import { AshbringerPostConfigTable } from "../../integrations/sheets/ashbringer/ashbringer-post-config";
import { AshbringerCandidate, AshbringerCandidatesTable } from "../../integrations/sheets/ashbringer/ashbringer-candidates-data";

const ACCEPTED_ASHBRINGER_CLASSES = new Set(["Warrior", "Hunter", "Paladin"]);
const ACCEPTED_ASHBRINGER_ROLES = new Set(["Raider"]);

export async function updateListOfAshbringerCandidates(
  discordClient: Client,
): Promise<void> {
  const sheetClient = createSheetClient();
  const ashbringerInfoTable = new AshbringerPostConfigTable(
    sheetClient,
    CONFIG.GUILD.INFO_SHEET,
  );
  const ashbringerCandidatesTable = new AshbringerCandidatesTable(
    sheetClient,
    CONFIG.GUILD.INFO_SHEET,
  );
  const playerInfoTable = new PlayerInfoTable(
    sheetClient,
    CONFIG.GUILD.INFO_SHEET,
  );
  const allPlayers = await playerInfoTable.getAllValues();
  const discordIdMainName = new Map(
    allPlayers.map((t) => [t.discordId, t.mainName]),
  );
  const ashbringerInfo = await ashbringerInfoTable.getValueById(
    CONFIG.GUILD.DISCORD_SERVER_ID,
  );

  if (!ashbringerInfo) {
    return;
  }

  const announcementChannel = await discordClient.channels.fetch(
    ashbringerInfo?.channelId,
  );
  if (
    !announcementChannel ||
    !announcementChannel.isTextBased() ||
    !announcementChannel.isSendable()
  ) {
    return;
  }

  const announcementMessage = await announcementChannel.messages.fetch(
    ashbringerInfo.announcementMessageId,
  );
  if (!announcementMessage) {
    return;
  }

  const reactions = announcementMessage.reactions.cache;
  const orangeHeartReaction = reactions.find((t) => t.emoji.name === "🧡");
  if (!orangeHeartReaction) {
    return;
  }

  const users = await orangeHeartReaction.users.fetch();
  const userIds = users.map((t) => t.id);
  const server = await discordClient.guilds.fetch(
    CONFIG.GUILD.DISCORD_SERVER_ID,
  );
  if (!server) {
    return;
  }

  const members = await Promise.all(
    userIds.map(async (t) => fetchMemberOrNull(server, t)),
  );
  const casterRaiders = members
    .filter((t): t is GuildMember => t !== null)
    .filter((t) => {
      return t.roles.cache.find((x) => ACCEPTED_ASHBRINGER_ROLES.has(x.name));
    })
    .filter((t) => {
      return t.roles.cache.find((x) => ACCEPTED_ASHBRINGER_CLASSES.has(x.name));
    });
  const ashbringerCandidates: AshbringerCandidate[] = casterRaiders.map((t) => ({
    characterClass:
      t.roles.cache.find((x) => ACCEPTED_ASHBRINGER_CLASSES.has(x.name))?.name ??
      "",
    characterName: discordIdMainName.get(t.id) ?? "",
    ashbringerStatus: "NotAnnounced",
  }));

  await ashbringerCandidatesTable.insertMany(
    ashbringerCandidates.sort((x, y) =>
      x.characterName.localeCompare(y.characterName),
    ),
  );
}
