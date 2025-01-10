import { Client } from "discord.js";
import { CONFIG } from "../../config";
import {
  findMessageOfBotInHistory,
  sendMessageToChannel,
} from "../../discord/utils";
import { RaidEvent } from "../../integrations/raid-helper/types";
import { SheetClient } from "../../integrations/sheets/config";
import { isRaidEventInAmountOfTime } from "../time-utils";
import { getSoftReserveInformation } from "../soft-reserves/missing-softreserves";
import { RaidConfigTable } from "../../integrations/sheets/raid-config-table";
import { Roster } from "../roster-helper";
import { getSoftresLink } from "../../integrations/softres/utils";

const ONE_HOUR_BEFORE_RAID = 60 * 60 * 1000;
const INFO_SHEET_ID = CONFIG.GUILD.INFO_SHEET;

export async function tryAdvertiseMissingSoftReserves(
  discordClient: Client,
  sheetClient: SheetClient,
  raidEvent: RaidEvent,
  roster: Roster,
): Promise<void> {
  // Check if it's 1 hour before the raid
  if (!isRaidEventInAmountOfTime(raidEvent, ONE_HOUR_BEFORE_RAID)) {
    return;
  }

  // Get the soft reserve info
  const softResInfoTable = new RaidConfigTable(sheetClient, INFO_SHEET_ID);
  const allSoftresRaidInfo = await softResInfoTable.getAllValues();
  const softReserveInfo = await getSoftReserveInformation(
    raidEvent,
    sheetClient,
    INFO_SHEET_ID,
    roster,
  );

  // Format
  const formatted = `## Missing Soft Reserves
${softReserveInfo
  .map(
    (
      curr,
    ) => `### For ${allSoftresRaidInfo.find((t) => t.raidId === curr.instanceRoster.instanceName)?.raidName}
The following players haven't soft-reserved yet: ${curr.missingPlayers.map((t) => `<@${t.discordId}>`).join(", ")}
Click [here](${getSoftresLink(curr.instanceRoster.softresId)}) to fill in your soft-reserves.`,
  )
  .join("\n")}`;

  // Post or Edit message
  const message = await findMessageOfBotInHistory(
    discordClient,
    raidEvent.channelId,
    "## Missing Soft Reserves",
  );

  const thereAreNoSoftReserves =
    softReserveInfo.length === 0 ||
    softReserveInfo.every((t) => t.missingPlayers.length === 0);
  if (!message && thereAreNoSoftReserves) {
    // Do nothing
    return;
  }
  if (message && thereAreNoSoftReserves) {
    // Delete the existing message
    await message.delete();
    return;
  }

  if (message !== null) {
    // Edit
    await message.edit(formatted);
  } else {
    // Send
    await sendMessageToChannel(discordClient, raidEvent.channelId, formatted);
  }
}
