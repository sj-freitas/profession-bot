import { CONFIG } from "../config";
import { Database } from "../exports/mem-database";
import { getRosterFromRaidEvent } from "../flows/roster-helper";
import { getSoftReserveInformation } from "../flows/soft-reserves/missing-softreserves";
import { fetchEvent } from "../integrations/raid-helper/raid-helper-client";
import { createSheetClient } from "../integrations/sheets/config";
import { RaidConfigTable } from "../integrations/sheets/raid-config-table";
import { CommandHandler } from "./commandHandler";

const { INFO_SHEET } = CONFIG.GUILD;

export const handleMissingSoftreserves: CommandHandler<Database> = async ({
  options,
  payload: database,
  reply,
}): Promise<void> => {
  const eventId = options.getString("event-id");
  if (eventId === null) {
    await reply("Failed to provide a valid event-id, please try another one.");
    return;
  }

  const sheetClient = createSheetClient();
  const softResInfoTable = new RaidConfigTable(sheetClient, INFO_SHEET);
  const raidEvent = await fetchEvent(eventId);
  if (!raidEvent) {
    return;
  }

  const roster = await getRosterFromRaidEvent(raidEvent, database);
  const allSoftresRaidInfo = await softResInfoTable.getAllValues();
  const softReserveInfo = await getSoftReserveInformation(
    raidEvent,
    sheetClient,
    INFO_SHEET,
    roster,
  );

  const formatted = `## Missing Soft Reserves
${softReserveInfo
  .map(
    (
      curr,
    ) => `### For ${allSoftresRaidInfo.find((t) => t.raidId === curr.instanceRoster.instanceName)?.raidName}
The following players haven't soft-reserved yet: ${curr.missingPlayers.map((t) => `<@${t.discordId}>`).join(", ")}`,
  )
  .join("\n")}`;

  await reply(formatted);
};
