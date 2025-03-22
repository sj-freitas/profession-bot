import { SheetClient } from "../integrations/sheets/config";
import { RaidInfoTable } from "../integrations/sheets/raid-info";
import {
  RaidConfig,
  RaidConfigTable,
} from "../integrations/sheets/raid-config-table";
import { getRaid } from "../integrations/softres/softres-client";
import { RaidInstance } from "../integrations/softres/types";

export interface InstanceInfo {
  raidName: string;
  raidId: string;
  useSoftres: boolean;
  useWorldBuffs: boolean;
  usePointSystem: boolean;
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
  const raidConfigDataTable = new RaidConfigTable(sheetClient, INFO_SHEET);
  const allRaidsConfigData = await raidConfigDataTable.getAllValues();
  const raidInfo = await raidInfoTable.getValueById(eventId);
  if (!raidInfo) {
    return [];
  }

  const softReserves = (
    await Promise.all(raidInfo.softresIds.map(async (t) => getRaid(t)))
  )
    .filter((t): t is RaidInstance => t !== null)
    .map((t) => allRaidsConfigData.find((x) => x.raidId === t.instances[0]))
    .filter((t): t is RaidConfig => t !== undefined);

  return softReserves.map((t) => ({
    raidName: t.raidName,
    raidId: t.raidId,
    useSoftres: t.useSoftRes,
    useWorldBuffs: t.useWbItems,
    usePointSystem: t.usePointSystem,
  }));
}
