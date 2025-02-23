import { Client } from "discord.js";
import {
  PlayerInfo,
  PlayerInfoTable,
} from "../../integrations/sheets/player-info-table";
import { SheetClient } from "../../integrations/sheets/config";
import { CONFIG } from "../../config";
import { fetchMemberOrNull } from "../../discord/utils";

const { INFO_SHEET, DISCORD_SERVER_ID } = CONFIG.GUILD;
const IGNORE_ROLES = new Set(["@everyone", "New joiner"]);

/**
 * Automatically synchronizes player discord data with the sheet, it does not
 * synchronize the characters, that needs to be done via another command. If a player
 * changes their display name in the server, that chang will be reflected here.
 *
 * @param discordClient
 * @param sheetClient
 */
export async function automaticFlushOfDiscordRoles(
  discordClient: Client,
  sheetClient: SheetClient,
): Promise<void> {
  const playerInfoTable = new PlayerInfoTable(sheetClient, INFO_SHEET);
  const allPlayers = await playerInfoTable.getAllValues();
  const guildInfo = await discordClient.guilds.fetch(DISCORD_SERVER_ID);

  // Map players to discordUsers
  const allDiscordUsers = (
    await Promise.all(
      allPlayers.map(async (currPlayer) => {
        const currentMember = await fetchMemberOrNull(
          guildInfo,
          currPlayer.discordId,
        );
        if (!currentMember) {
          return null;
        }

        const roles = currentMember.roles.valueOf();
        const currPlayerAltered: PlayerInfo = {
          ...currPlayer,
          discordHandle: `@${currentMember.user.username}`,
          discordServerHandle: `@${currentMember.displayName}`,
          discordRoles: roles
            .map((t) => t.name)
            .filter((t) => !IGNORE_ROLES.has(t)),
        };

        return currPlayerAltered;
      }),
    )
  ).filter((t): t is PlayerInfo => t !== null);

  await Promise.all(
    allDiscordUsers.map(async (t) => await playerInfoTable.updateValue(t)),
  );
}
