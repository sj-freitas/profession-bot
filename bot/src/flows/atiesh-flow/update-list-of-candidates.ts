import { Client, GuildMember } from "discord.js";
import { CONFIG } from "../../config";
import { AtieshCandidatesTable } from "../../integrations/sheets/atiesh/atiesh-candidates-data";
import { AtieshPostConfigTable } from "../../integrations/sheets/atiesh/atiesh-post-config";
import { createSheetClient } from "../../integrations/sheets/config";
import { PlayerInfoTable } from "../../integrations/sheets/player-info-table";
import { fetchMemberOrNull } from "../../discord/utils";

const ACCEPTED_ATIESH_CLASSES = new Set(["Mage", "Priest", "Warlock", "Druid"]);

export async function updateListOfAtieshCandidates(
  discordClient: Client,
): Promise<void> {
  const sheetClient = createSheetClient();
  const atieshInfoTable = new AtieshPostConfigTable(
    sheetClient,
    CONFIG.GUILD.INFO_SHEET,
  );
  const atieshCandidatesTable = new AtieshCandidatesTable(
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
  const atieshInfo = await atieshInfoTable.getValueById(
    CONFIG.GUILD.DISCORD_SERVER_ID,
  );

  if (!atieshInfo) {
    return;
  }

  const announcementChannel = await discordClient.channels.fetch(
    atieshInfo?.channelId,
  );
  if (
    !announcementChannel ||
    !announcementChannel.isTextBased() ||
    !announcementChannel.isSendable()
  ) {
    return;
  }

  const announcementMessage = await announcementChannel.messages.fetch(
    atieshInfo.announcementMessageId,
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
  const atieshCandidates = members
    .filter((t): t is GuildMember => t !== null)
    .filter((t) =>
      t.roles.cache.find((x) => ACCEPTED_ATIESH_CLASSES.has(x.name)),
    )
    .map((t) => ({
      characterClass:
        t.roles.cache.find((x) => ACCEPTED_ATIESH_CLASSES.has(x.name))?.name ??
        "",
      characterName: discordIdMainName.get(t.id) ?? "",
    }));

  await atieshCandidatesTable.insertMany(
    atieshCandidates.sort((x, y) =>
      x.characterName.localeCompare(y.characterName),
    ),
  );
}
