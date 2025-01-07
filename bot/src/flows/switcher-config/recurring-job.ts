import { Client } from "discord.js";
import { SheetClient } from "../../integrations/sheets/config";
import { CONFIG } from "../../config";
import { getPlayers } from "../../integrations/sheets/get-players";
import { findMessageInHistoryById } from "../../discord/utils";
import {
  Switcher,
  SwitcherRoleDataTable,
} from "../../integrations/sheets/switcher-role-data";
import { SwitcherRoleConfigTable } from "../../integrations/sheets/switcher-post-config";

const { INFO_SHEET, DISCORD_SERVER_ID } = CONFIG.GUILD;

function sortByPreference(switchers: Switcher[]) {
  return switchers.sort(
    (a, b) => (a.isMainBackup ? 0 : 1) - (b.isMainBackup ? 0 : 1),
  );
}

function getFormattedName({ characterName, isMainBackup }: Switcher) {
  return isMainBackup ? `**${characterName}**` : characterName;
}

export async function tryUpdateSwitcherPost(
  discordClient: Client,
  sheetClient: SheetClient,
) {
  const switcherRoleData = new SwitcherRoleDataTable(sheetClient, INFO_SHEET);
  const allSwitchers = await switcherRoleData.getAllValues();

  const groupedByRole = allSwitchers.reduce((map, next) => {
    map.set(
      next.switcherRole,
      sortByPreference([...(map.get(next.switcherRole) ?? []), next]),
    );
    return map;
  }, new Map<string, Switcher[]>());

  const playerInfo = await getPlayers(sheetClient, INFO_SHEET);
  const flattenedCharacter: [character: string, discordId: string][] =
    playerInfo
      .map((t) => t.characters.map((x) => [x, t.discordId]))
      .flatMap((t) => t)
      .map(([character, discordId]) => [character, discordId]);
  const map = new Map<string, string>(flattenedCharacter);

  const formattedContent = `## Switcher List
Names in bold are highlighted as main switchers and they should have slightly priority on gear and should end up doing these roles more frequently.
${[...groupedByRole.entries()]
  .map(
    ([key, value]) => `### ${key}
${value.map((t) => ` - ${getFormattedName(t)} (<@${map.get(t.characterName)}>)`).join("\n")}`,
  )
  .join("\n")}`;

  // TODO Create the message if it doesn't exist
  const switcherRoleConfig = await new SwitcherRoleConfigTable(
    sheetClient,
    INFO_SHEET,
  ).getValueById(DISCORD_SERVER_ID);

  if (!switcherRoleConfig) {
    return;
  }

  const message = await findMessageInHistoryById(
    discordClient,
    switcherRoleConfig.channelId,
    switcherRoleConfig.messageId,
  );

  if (!message) {
    return;
  }
  if (message.content === formattedContent) {
    return;
  }

  await message.edit(formattedContent);
}
