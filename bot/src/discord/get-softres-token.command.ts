/* eslint-disable no-console */
import { MessageFlags } from "discord.js";
import { CONFIG } from "../config";
import { Database } from "../exports/mem-database";
import { RAID_HELPER_AUTHOR } from "../integrations/raid-helper/constants";
import { createSheetClient } from "../integrations/sheets/config";
import { RaidInfoTable } from "../integrations/sheets/raid-info";
import { SoftresRaidDataTable } from "../integrations/sheets/softres-raid-data";
import { getRaid } from "../integrations/softres/softres-client";
import { getSoftresLink } from "../integrations/softres/utils";
import { CommandHandler } from "./commandHandler";

const OFFICER_ROLE = "Staff";
const { INFO_SHEET } = CONFIG.GUILD;

export const getAllSoftresTokens: CommandHandler<Database> = async ({
  interaction,
  reply,
}): Promise<void> => {
  const { channel, member } = interaction;

  if (!channel || !channel.isTextBased() || !member?.roles) {
    await reply("Invalid channel");
    return;
  }

  const sheetClient = createSheetClient();
  const roles = Array.isArray(member.roles) ? member.roles : [];

  if (roles.find((t) => t !== OFFICER_ROLE)) {
    await reply("User doesn't have required role");
  }

  // Find the raid messages
  const raidInfoTable = new RaidInfoTable(sheetClient, INFO_SHEET);
  const softReserveInfoTable = new SoftresRaidDataTable(
    sheetClient,
    INFO_SHEET,
  );
  const allInfos = await softReserveInfoTable.getAllValues();
  const raidNameMap = new Map(allInfos.map((t) => [t.softresId, t.raidName]));
  const allMessages = await channel.messages.fetch();
  const raidHelperMessages = allMessages.filter(
    (x) => x.author.id === RAID_HELPER_AUTHOR,
  );

  const allRaidEvents = (
    await Promise.all(
      raidHelperMessages.map(async ({ id }) => raidInfoTable.getValueById(id)),
    )
  ).filter((t) => t !== null);

  const softResInfo = allRaidEvents
    .map((t) =>
      t.softresIds.map((x, idx) => ({
        raidId: x,
        token: t.softresTokens[idx],
      })),
    )
    .flatMap((t) => t);

  const allSoftresRaids = (
    await Promise.all(
      softResInfo.map(async (t) => {
        const data = await getRaid(t.raidId);

        if (data === null) {
          return null;
        }

        return {
          ...data,
          token: t.token,
        };
      }),
    )
  ).filter((t) => t !== null);

  if (allSoftresRaids.length === 0) {
    await reply(
      `There are no raid events with soft-reserves associated with this channel`,
    );
    return;
  }

  await interaction.reply({
    content: `### Softres tokens and ids
${allSoftresRaids.map((t) => `- [${raidNameMap.get(t.instances[0])} (${t.raidId})](${getSoftresLink(t.raidId)}) - token = \`${t.token}\` `).join("\n")}`,
    ephemeral: true,
    flags: MessageFlags.SuppressEmbeds,
  });
};
