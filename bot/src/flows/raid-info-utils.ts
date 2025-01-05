import { SheetClient } from "../integrations/sheets/config";
import { RaidInfoTable } from "../integrations/sheets/raid-info";
import {
  SoftresRaidData,
  SoftresRaidDataTable,
} from "../integrations/sheets/softres-raid-data";
import { getRaid } from "../integrations/softres/softres-client";
import { RaidInstance } from "../integrations/softres/types";

export interface InstanceInfo {
  raidName: string;
  raidId: string;
}

/**
 * Fetches all instances associated with a specific raid event. It'll get the instance information from associated
 * soft-reserves, which assumes that the soft-reserves are already created.
 *
 * NOTE: There's always an assumption here that there is ONE soft reserve instance per raid type and not per
 * raid night.
 *
 * @param sheetClient The sheet client to retrieve the raid info and soft reserve info from.
 * @param INFO_SHEET The sheet id associated to this guild.
 * @param eventId The event to retrieve the data from.
 *
 * @returns An array of all instances, empty if none found.
 */
export async function getInstanceInfosFromRaidEventId(
  sheetClient: SheetClient,
  INFO_SHEET: string,
  eventId: string,
): Promise<InstanceInfo[]> {
  // Cross check roster with soft-reserves
  const raidInfoTable = new RaidInfoTable(sheetClient, INFO_SHEET);
  const softReservesDataTable = new SoftresRaidDataTable(
    sheetClient,
    INFO_SHEET,
  );
  const allSoftReservesData = await softReservesDataTable.getAllValues();
  const raidInfo = await raidInfoTable.getValueById(eventId);
  if (!raidInfo) {
    return [];
  }

  const softReserves = (
    await Promise.all(raidInfo.softresIds.map(async (t) => getRaid(t)))
  )
    .filter((t): t is RaidInstance => t !== null)
    .map((t) => allSoftReservesData.find((x) => x.softresId === t.raidId[0]))
    .filter((t): t is SoftresRaidData => t !== undefined);

  return softReserves.map((t) => ({
    raidName: t.raidName,
    raidId: t.softresId,
  }));
}
