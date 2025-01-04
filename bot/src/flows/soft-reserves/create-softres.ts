/* eslint-disable no-console */
import { Client } from "discord.js";
import { CONFIG } from "../../config";
import { sendMessageToChannel } from "../../discord/utils";
import { createSheetClient } from "../../integrations/sheets/config";
import { RaidInfoTable } from "../../integrations/sheets/raid-info";
import { SoftresRaidDataTable } from "../../integrations/sheets/softres-raid-data";
import { raidCreate } from "../../integrations/softres/softres-client";
import { getSoftresLink } from "../../integrations/softres/utils";
import { RaidInstance } from "../../integrations/softres/types";

const SOFT_RESERVE_MESSAGE_TITLE = "## Soft-Reserves for this raid are up!";

export function isSoftReserveMessage(content: string) {
  return content.indexOf(SOFT_RESERVE_MESSAGE_TITLE) === 0;
}

export function createSoftReserveMessage(
  associatedSoftReserves: RaidInstance[],
  raidNames: Map<string, string>,
): string {
  return `${SOFT_RESERVE_MESSAGE_TITLE}
Please make sure that your name is spelled exactly the same in-game.
${associatedSoftReserves.map((t) => ` - **[${raidNames.get(t.instances[0])}](${getSoftresLink(t.raidId)})** SR x${t.amount}`).join("\n")}
${associatedSoftReserves.find((t) => t.instances[0].indexOf("aq40") >= 0 && t.allowDuplicate && t.amount >= 2) ? "Any double SR'd AQ tokens will be rolled at the end with the top rollers winning a token per winning roll." : ""}`;
}

export function createOfficerSoftReserveMessage(
  associatedSoftReserves: RaidInstance[],
  raidNames: Map<string, string>,
): string {
  return `## I created these soft reserve raids
${associatedSoftReserves.map((t) => ` - **[${raidNames.get(t.instances[0])} / ${t.raidId}](${getSoftresLink(t.raidId)})** Token = \`${t.token}\``).join("\n")}
    
Feel free to manage them`;
}

export async function createAndAdvertiseSoftres(
  discordClient: Client,
  raidEvent: { id: string; description?: string; channelId: string },
  officerChannelId?: string,
) {
  const { description: unsanitizedDescription, channelId } = raidEvent;
  if (!unsanitizedDescription || !channelId) {
    return;
  }

  const description = unsanitizedDescription.toLowerCase();
  const sheetClient = createSheetClient();
  const raidInfo = new RaidInfoTable(sheetClient, CONFIG.GUILD.INFO_SHEET);
  const softresRaidDataTable = new SoftresRaidDataTable(
    sheetClient,
    CONFIG.GUILD.INFO_SHEET,
  );
  const softresRaidData = (await softresRaidDataTable.getAllValues()).filter(
    (t) => t.useSoftRes === "TRUE",
  );
  const raids = new Map(softresRaidData.map((t) => [t.softresId, t.raidName]));
  const matchingTerms = softresRaidData
    .map((t) =>
      t.raidNameMatchingTerms
        .split(";")
        .map((x) => x.trim())
        .filter((x) => Boolean(x))
        .map((x) => ({ tag: x.toLowerCase(), instance: t.softresId })),
    )
    .flatMap((t) => t);
  const matchingRaids = new Set(
    matchingTerms
      .filter(({ tag }) => description.indexOf(tag) >= 0)
      .map((t) => t.instance),
  );
  if (matchingRaids.size === 0) {
    console.log(`Could not find a corresponding raid for "${description}"`);
    // Should we return here ?
  }

  const associatedSoftReserves = await Promise.all(
    [...matchingRaids].map(
      async (t) =>
        await raidCreate({
          allowDuplicate: true,
          amount: 2,
          faction: "Alliance",
          instances: [t],
        }),
    ),
  );

  if (associatedSoftReserves.length !== 0) {
    await sendMessageToChannel(
      discordClient,
      channelId,
      createSoftReserveMessage(associatedSoftReserves, raids),
    );
  }
  if (associatedSoftReserves.length !== 0 && officerChannelId) {
    await sendMessageToChannel(
      discordClient,
      officerChannelId,
      createOfficerSoftReserveMessage(associatedSoftReserves, raids),
    );
  }

  await raidInfo.upsertValue({
    eventId: raidEvent.id,
    serverId: CONFIG.GUILD.DISCORD_SERVER_ID,
    channelId: raidEvent.channelId,
    softresId: associatedSoftReserves.map((x) => x.raidId).join(";"),
    softresToken: associatedSoftReserves.map((x) => x.token).join(";"),
    rosterHash: "",
    lastUpdated: new Date().toString(),
  });
}
