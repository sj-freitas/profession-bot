/* eslint-disable no-console */
import { Client } from "discord.js";
import { CONFIG } from "../../config";
import { sendMessageToChannel } from "../../discord/utils";
import { createSheetClient } from "../../integrations/sheets/config";
import { RaidInfo, RaidInfoTable } from "../../integrations/sheets/raid-info";
import {
  RaidConfig,
  RaidConfigTable,
} from "../../integrations/sheets/raid-config-table";
import { getRaid, raidCreate } from "../../integrations/softres/softres-client";
import { getSoftresLink } from "../../integrations/softres/utils";
import { RaidInstance } from "../../integrations/softres/types";

const SOFT_RESERVE_MESSAGE_TITLE = "## Soft-Reserves for this raid are up!";

export interface SoftresInfo {
  instances: string[];
  raidId: string;
  token?: string | null;
  allowDuplicate: boolean;
  amount: number;
}

export function isSoftReserveMessage(content: string) {
  return content.indexOf(SOFT_RESERVE_MESSAGE_TITLE) === 0;
}

export function createSoftReserveMessage(
  associatedSoftReserves: SoftresInfo[],
  raidNames: Map<string, string>,
): string {
  return `${SOFT_RESERVE_MESSAGE_TITLE}
Please make sure that your name is spelled exactly the same in-game.
${associatedSoftReserves.map((t) => ` - **[${raidNames.get(t.instances[0])}](${getSoftresLink(t.raidId)})** SR x${t.amount}`).join("\n")}
${associatedSoftReserves.find((t) => t.instances[0].indexOf("aq40") >= 0 && t.allowDuplicate && t.amount >= 2) ? "Any double SR'd AQ tokens will be rolled at the end with the top rollers winning a token per winning roll." : ""}`;
}

async function getRaidIdsFromDescription(
  unsanitizedDescription: string,
): Promise<RaidConfig[]> {
  const description = unsanitizedDescription.toLowerCase();
  const sheetClient = createSheetClient();
  const softresRaidDataTable = new RaidConfigTable(
    sheetClient,
    CONFIG.GUILD.INFO_SHEET,
  );
  const raidConfigs = (await softresRaidDataTable.getAllValues()).filter(
    (t) => t.useSoftRes,
  );
  const matchingTerms = raidConfigs
    .map((t) =>
      t.raidNameMatchingTerms.map((x) => ({
        tag: x.toLowerCase(),
        instance: t,
      })),
    )
    .flatMap((t) => t);
  const matchingRaids = new Set(
    matchingTerms
      .filter(({ tag }) => description.indexOf(tag) >= 0)
      .map((t) => t.instance),
  );

  return [...matchingRaids];
}

export async function createAnyMissingSoftresRaids(
  raidEvent: { id: string; description?: string; channelId: string },
  raidInfo: RaidInfo,
): Promise<SoftresInfo[]> {
  const { description: unsanitizedDescription, channelId } = raidEvent;
  if (!unsanitizedDescription || !channelId) {
    return [];
  }

  const matchingRaids = await getRaidIdsFromDescription(unsanitizedDescription);

  // Check all existing raids
  const currentlyExistingRaids = (
    await Promise.all(
      raidInfo.softresIds.map(async (softresRaidId) => getRaid(softresRaidId)),
    )
  )
    .filter((t): t is RaidInstance => t !== null)
    .filter((t) =>
      matchingRaids.find((currConfig) => currConfig.raidId === t.instances[0]),
    );

  const raidsToCreate = matchingRaids.filter(
    (t) => !currentlyExistingRaids.find((x) => x.instances[0] === t.raidId),
  );
  const createdMissingSoftresRaids: SoftresInfo[] = (
    await Promise.all(
      [...raidsToCreate].map(
        async (t) =>
          await raidCreate({
            allowDuplicate: t.allowDuplicates,
            amount: t.softresAmount,
            faction: "Alliance",
            instances: [t.raidId],
          }),
      ),
    )
  )
    .filter((t): t is RaidInstance => t !== null)
    .map((t) => ({
      raidId: t.raidId,
      token: t.token,
      instances: t.instances,
      amount: t.amount,
      allowDuplicate: t.allowDuplicate,
    }));

  const originalInOrder = raidInfo.softresIds
    .map((oldRaidId, idx) => {
      const existing = currentlyExistingRaids.find(
        (existingRaid) => oldRaidId === existingRaid.raidId,
      );

      if (!existing) {
        return null;
      }

      const softResInfo: SoftresInfo = {
        raidId: oldRaidId,
        token: raidInfo.softresTokens[idx],
        instances: existing.instances,
        amount: existing.amount,
        allowDuplicate: existing.allowDuplicate,
      };
      return softResInfo;
    })
    .filter((t): t is SoftresInfo => t !== null);

  return [...originalInOrder, ...createdMissingSoftresRaids];
}

export async function createAndAdvertiseSoftres(
  discordClient: Client,
  raidEvent: { id: string; description?: string; channelId: string },
) {
  const sheetClient = createSheetClient();
  const raidInfo = new RaidInfoTable(sheetClient, CONFIG.GUILD.INFO_SHEET);
  const softresRaidData = await new RaidConfigTable(
    sheetClient,
    CONFIG.GUILD.INFO_SHEET,
  ).getAllValues();
  const { description: unsanitizedDescription, channelId } = raidEvent;
  if (!unsanitizedDescription || !channelId) {
    return;
  }

  const raids = new Map(softresRaidData.map((t) => [t.raidId, t.raidName]));
  const matchingRaids = await getRaidIdsFromDescription(unsanitizedDescription);
  if (matchingRaids.length === 0) {
    return;
  }

  const associatedSoftReserves = (
    await Promise.all(
      [...matchingRaids].map(
        async (raidInstanceConfig) =>
          await raidCreate({
            allowDuplicate: raidInstanceConfig.allowDuplicates,
            amount: raidInstanceConfig.softresAmount,
            faction: "Alliance",
            instances: [raidInstanceConfig.raidId],
          }),
      ),
    )
  ).filter((t): t is RaidInstance => t !== null);

  if (associatedSoftReserves.length !== 0) {
    await sendMessageToChannel(
      discordClient,
      channelId,
      createSoftReserveMessage(associatedSoftReserves, raids),
    );
  }

  await raidInfo.upsertValue({
    eventId: raidEvent.id,
    serverId: CONFIG.GUILD.DISCORD_SERVER_ID,
    channelId: raidEvent.channelId,
    softresIds: associatedSoftReserves.map((x) => x.raidId),
    softresTokens: associatedSoftReserves.map((x) => `${x.token}`),
    rosterHash: "",
    lastUpdated: new Date(),
  });
}
