import { CONFIG } from "../config";
import { Database } from "../exports/mem-database";
import { getSoftReserveInformation } from "../flows/soft-reserves/missing-softreserves";
import { fetchEvent } from "../integrations/raid-helper/raid-helper-client";
import { createSheetClient } from "../integrations/sheets/config";
import { SoftresRaidDataTable } from "../integrations/sheets/softres-raid-data";
import { CommandHandler } from "./commandHandler";

const { INFO_SHEET } = CONFIG.GUILD;

export const handleMissingSoftreserves: CommandHandler<Database> = async ({
  options,
  reply,
}): Promise<void> => {
  const eventId = options.getString("event-id");
  if (eventId === null) {
    await reply("Failed to provide a valid event-id, please try another one.");
    return;
  }

  const sheetClient = createSheetClient();
  const softResInfoTable = new SoftresRaidDataTable(sheetClient, INFO_SHEET);
  const raidEvent = await fetchEvent(eventId);
  if (!raidEvent) {
    return;
  }

  const allSoftresRaidInfo = await softResInfoTable.getAllValues();
  const softReserveInfo = await getSoftReserveInformation(
    raidEvent,
    sheetClient,
    INFO_SHEET,
  );

  const formatted = `## Missing Soft Reserves
${softReserveInfo
  .map(
    (
      curr,
    ) => `### For ${allSoftresRaidInfo.find((t) => t.softresId === curr.instanceRoster.instanceName)?.raidName}
The following players haven't soft-reserved yet: ${curr.missingPlayers.map((t) => `<@${t.discordId}>`).join(", ")}`,
  )
  .join("\n")}`;

  await reply(formatted);
};
