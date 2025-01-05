import { Client } from "discord.js";
import { CONFIG } from "../../config";
import {
  findMessageInHistory,
  sendMessageToChannel,
} from "../../discord/utils";
import { RaidEvent } from "../../integrations/raid-helper/types";
import { SheetClient } from "../../integrations/sheets/config";
import { isRaidEventInAmountOfTime } from "../time-utils";
import { getSoftReserveInformation } from "../soft-reserves/missing-softreserves";
import { SoftresRaidDataTable } from "../../integrations/sheets/softres-raid-data";
import { Database } from "../../exports/mem-database";

const ONE_HOUR_BEFORE_RAID = 60 * 60 * 1000;
const INFO_SHEET_ID = CONFIG.GUILD.INFO_SHEET;

export async function tryAdvertiseMissingSoftReserves(
  discordClient: Client,
  database: Database,
  sheetClient: SheetClient,
  raidEvent: RaidEvent,
): Promise<void> {
  // Check if it's 1 hour before the raid
  if (!isRaidEventInAmountOfTime(raidEvent, ONE_HOUR_BEFORE_RAID)) {
    return;
  }

  // Get the soft reserve info
  const softResInfoTable = new SoftresRaidDataTable(sheetClient, INFO_SHEET_ID);
  const allSoftresRaidInfo = await softResInfoTable.getAllValues();
  const softReserveInfo = await getSoftReserveInformation(
    raidEvent,
    database,
    sheetClient,
    INFO_SHEET_ID,
  );

  // Format
  const formatted = `## Missing Soft Reserves
${softReserveInfo
    .map(
      (curr) => `### For ${allSoftresRaidInfo.find((t) => t.softresId === curr.instanceRoster.instanceName)?.raidName}
The following players haven't soft-reserved yet: ${curr.missingPlayers.map((t) => `<@${t.discordId}>`).join(", ")}`,
    )
    .join("\n")}`;

  // Post or Edit message
  const message = await findMessageInHistory(
    discordClient,
    raidEvent.channelId,
    "## Missing Soft Reserves",
  );

  if (message && softReserveInfo.every((t) => t.missingPlayers.length === 0)) {
    await message.delete();
  }

  if (message !== null) {
    // Edit
    await message.edit(formatted);
  } else {
    // Send
    await sendMessageToChannel(discordClient, raidEvent.channelId, formatted);
  }
}
