/* eslint-disable no-console */
import { CONFIG } from "./config";
import { createSheetClient } from "./integrations/sheets/config";
import { getWorldBuffInfo } from "./integrations/sheets/get-buffers";
import { PlayerInfoTable } from "./integrations/sheets/player-info-table";

async function main() {
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

  const formatted = `## Following list contains the buffs assigned per individual
${sorted.map((t) => ` - <@${t.discordId}> ${t.buffs.join(", ")}`).join("\n")}`;

  console.log(formatted);

  const nonBuffers = sorted.filter((t) => t.buffs.length === 0);
  const postMessage = `${nonBuffers.map((t) => `<@${t.discordId}>`).join(" ")}
We noticed that none of you are assigned to a world buff. You can check the list [here](https://discord.com/channels/1170959696174272663/1267504621946011683/1326188635594424330)
Since you are all marked as raiders, please react with:
- :one: If you are fine being automatically assigned a buff
- :two: If you are fine being automatically assigned two more than one buff
- :three: If you want to assign a buff yourself and please reply below.

Thank you!`;

  console.log(postMessage);

  // const discordClient = await createClient();
  // const database = new Database();
  // await refreshDatabase(database);

  // const raidEvent = await fetchEvent("1325581857605287986");
  // if (!raidEvent) {
  //   return;
  // }
  // const roster = await getRosterFromRaidEvent(raidEvent, database);
  // await tryPostFightAssignments(
  //   discordClient,
  //   createSheetClient(),
  //   raidEvent,
  //   roster,
  // );

  // await discordClient.destroy();
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main().catch((err) => console.error(err));
