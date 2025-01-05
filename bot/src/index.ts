/* eslint-disable no-console */
import { CONFIG } from "./config";
import {
  findRepeatedPlayers,
  getSoftReserveInformation,
} from "./flows/soft-reserves/missing-softreserves";
import { fetchEvent } from "./integrations/raid-helper/raid-helper-client";
import { createSheetClient } from "./integrations/sheets/config";
import { SoftresRaidDataTable } from "./integrations/sheets/softres-raid-data";

const { INFO_SHEET } = CONFIG.GUILD;

async function main() {
  const sheetClient = createSheetClient();
  const softResInfoTable = new SoftresRaidDataTable(sheetClient, INFO_SHEET);
  const raidEvent = await fetchEvent("1323050296871489626");
  if (!raidEvent) {
    return;
  }

  const allSoftresRaidInfo = await softResInfoTable.getAllValues();
  const raidReserveInformation = await getSoftReserveInformation(
    raidEvent,
    sheetClient,
    INFO_SHEET,
  );

  for (const curr of raidReserveInformation) {
    console.log(`## For ${allSoftresRaidInfo.find((t) => t.softresId === curr.instanceRoster.instanceName)?.raidName}
The following players haven't soft-reserved yet: ${curr.missingPlayers.map((t) => `<@${t.discordId}>`).join(", ")}`);

    // Find people with more than one character registered
    const playersWithMoreThanOneSoftresPerChar = findRepeatedPlayers(curr);
    console.log(playersWithMoreThanOneSoftresPerChar);
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main().catch((err) => console.error(err));
