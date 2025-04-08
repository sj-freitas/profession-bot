/* eslint-disable no-console */
import { CONFIG } from "../config";
import { Database } from "../exports/mem-database";
import { createSheetClient } from "../integrations/sheets/config";
import { PlayerInfoTable } from "../integrations/sheets/player-info-table";
import { CommandHandler } from "./commandHandler";

const sheetClient = createSheetClient();
const playerInfoTable = new PlayerInfoTable(
  sheetClient,
  CONFIG.GUILD.INFO_SHEET,
);

export const optInAssignmentsInDms: CommandHandler<Database> = async ({
  interaction,
  payload,
  reply,
}): Promise<void> => {
  const userId = interaction.user.id;
  const playerAccount = payload
    .getPlayerInfos()
    .find((t) => t.discordId === userId);

  if (!playerAccount) {
    await reply(
      `You do not exist in our database! You can add yourself by adding a character, do /char-add and follow the instructions.`,
    );
    return;
  }

  if (playerAccount.hasDmRaidAssignmentsEnabled) {
    await reply(
      `You are already opted in to receive DM assignments. If you wish to opt out, do /assignment-opt-out`,
    );
  }

  await playerInfoTable.updateValue({
    ...playerAccount,
    hasDmRaidAssignmentsEnabled: true,
  });

  await reply(
    `You are now opted in to receive DM assignments. If you wish to opt out, do /assignment-opt-out`,
  );
};

export const optOutAssignmentsInDms: CommandHandler<Database> = async ({
  interaction,
  payload,
  reply,
}): Promise<void> => {
  const userId = interaction.user.id;
  const playerAccount = payload
    .getPlayerInfos()
    .find((t) => t.discordId === userId);

  if (!playerAccount) {
    await reply(
      `You do not exist in our database! You can add yourself by adding a character, do /char-add and follow the instructions.`,
    );
    return;
  }

  if (playerAccount.hasDmRaidAssignmentsEnabled) {
    await reply(
      `You are already opted out, you won't receive DM assignments. If you wish to receive assignment DMs, do /assignment-opt-in`,
    );
  }

  await playerInfoTable.updateValue({
    ...playerAccount,
    hasDmRaidAssignmentsEnabled: true,
  });

  await reply(
    `You are now opted out and you won't receive DM assignments. If you wish to receive assignment DMs, do /assignment-opt-in`,
  );
};
