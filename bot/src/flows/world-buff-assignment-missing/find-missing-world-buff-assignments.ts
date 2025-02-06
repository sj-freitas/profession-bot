import { CONFIG } from "../../config";
import { createSheetClient } from "../../integrations/sheets/config";
import { getWorldBuffInfo } from "../../integrations/sheets/get-buffers";
import { PlayerInfoTable } from "../../integrations/sheets/player-info-table";

export async function findMissingWorldBuffAssignments(): Promise<
  {
    discordId: string | undefined;
    name: string;
    buffs: string[];
  }[]
> {
  const sheetClient = createSheetClient();
  const wbInfo = await getWorldBuffInfo(sheetClient, CONFIG.GUILD.INFO_SHEET);
  const buffers = wbInfo
    .map((t) =>
      t.discordHandles.map((x) => ({
        buffName: t.buffInfo.shortName,
        name: x,
      })),
    )
    .flatMap((t) => t)
    .reduce(
      (res, t) => {
        const existingItem = res.find((x) => x.name === t.name);
        if (existingItem) {
          existingItem.buffs.push(t.buffName);
          return res;
        }

        return [...res, { name: t.name, buffs: [t.buffName] }];
      },
      [] as { name: string; buffs: string[] }[],
    );

  // These are the people assigned to buffs
  // Now we need to find those that aren't

  const allUsers = await new PlayerInfoTable(
    sheetClient,
    CONFIG.GUILD.INFO_SHEET,
  ).getAllValues();

  // Get Members that are either raider or staff
  const raiders = allUsers.filter((t) =>
    t.discordRoles.some((role) => role === "Raider" || role === "Staff"),
  );
  const raidersWithoutBuffAssignment = raiders.filter(
    (t) => !buffers.find((x) => x.name === t.discordHandle),
  );
  const allBuffersWithBuffNames = [
    ...buffers.map((t) => ({
      ...t,
      discordId: raiders.find((x) => x.discordHandle === t.name)?.discordId,
    })),
    ...raidersWithoutBuffAssignment.map((t) => ({
      name: t.discordHandle,
      buffs: [],
      discordId: t.discordId,
    })),
  ].filter((t) => t.discordId);

  const sorted = allBuffersWithBuffNames.sort(
    (t, v) => v.buffs.length - t.buffs.length,
  );

  const nonBuffers = sorted.filter((t) => t.buffs.length === 0);

  return nonBuffers;
}
