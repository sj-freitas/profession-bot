import { Client } from "discord.js";
import {
  createAndAdvertiseSoftres,
  createAnyMissingSoftresRaids,
  createSoftReserveMessage,
  isSoftReserveMessage,
} from "./create-softres";
import { createSheetClient } from "../../integrations/sheets/config";
import { CONFIG } from "../../config";
import { RaidInfoTable } from "../../integrations/sheets/raid-info";
import { fetchServerEvents } from "../../integrations/raid-helper/raid-helper-client";
import { getRaid } from "../../integrations/softres/softres-client";
import { SoftresRaidDataTable } from "../../integrations/sheets/softres-raid-data";
import { sendMessageToChannel } from "../../discord/utils";
import { RaidInstance } from "../../integrations/softres/types";

export async function pollChannelsForSoftReserves(
  discordClient: Client,
  channelIds: string[],
): Promise<void> {
  const channelsIdsSet = new Set(channelIds);
  const events = await fetchServerEvents(CONFIG.GUILD.DISCORD_SERVER_ID);
  if (events === null) {
    return;
  }
  const raidsOfChannels = (events.postedEvents ?? []).filter(
    (t) => channelsIdsSet.has(t.channelId) && t.description,
  );

  const sheetClient = createSheetClient();
  const softresRaidDataTable = new SoftresRaidDataTable(
    sheetClient,
    CONFIG.GUILD.INFO_SHEET,
  );
  const softresRaidData = await softresRaidDataTable.getAllValues();
  const raids = new Map(softresRaidData.map((t) => [t.softresId, t.raidName]));
  const raidInfo = new RaidInfoTable(sheetClient, CONFIG.GUILD.INFO_SHEET);

  await Promise.all(
    raidsOfChannels.map(async (serverRaidEvent) => {
      const channel = await discordClient.channels.fetch(
        serverRaidEvent.channelId,
      );
      if (!channel || !channel.isTextBased()) {
        return;
      }

      const messages = await channel.messages.fetch();
      const messagesOfBot = messages.filter(
        (t) => t.author.id === discordClient.application?.id,
      );

      const existingSoftReserveMessage = messagesOfBot.find((t) =>
        isSoftReserveMessage(t.content),
      );
      if (existingSoftReserveMessage) {
        // Channel already has soft reserves
        const existMessageContent = existingSoftReserveMessage.content;
        const raidEvent = await raidInfo.getValueById(serverRaidEvent.id);

        if (!raidEvent) {
          return;
        }

        const softReserveInfos = await createAnyMissingSoftresRaids(
          serverRaidEvent,
          raidEvent,
        );
        if (softReserveInfos.length === 0) {
          // Delete Flow
          await existingSoftReserveMessage.delete();
          await raidInfo.updateValue({
            ...raidEvent,
            softresIds: [],
            softresTokens: [],
            lastUpdated: new Date(),
          });
          return;
        }

        // Update Flow
        await raidInfo.updateValue({
          ...raidEvent,
          softresIds: softReserveInfos.map((t) => t.raidId),
          softresTokens: softReserveInfos.map((t) => t.token ?? "xxxxxxxxx"),
          lastUpdated: new Date(),
        });

        const newMessage = createSoftReserveMessage(softReserveInfos, raids);
        if (existMessageContent === newMessage) {
          return;
        }

        await existingSoftReserveMessage.edit(newMessage);

        return;
      }

      // No message exists, we can also see if a record already exists for this raid
      const raidEvent = await raidInfo.getValueById(serverRaidEvent.id);
      if (!raidEvent || raidEvent.softresTokens.length === 0) {
        await createAndAdvertiseSoftres(discordClient, serverRaidEvent);
        return;
      }

      const softReserveTokens = raidEvent.softresTokens;
      const softReserves = raidEvent.softresIds.map((t, idx) => ({
        raidId: t,
        token: softReserveTokens[idx],
      }));

      const associatedSoftReserves = (
        await Promise.all(
          softReserves.map(async (t) => {
            const raid = await getRaid(t.raidId);

            if (!raid) {
              return null;
            }
            return {
              ...raid,
              token: t.token,
            };
          }),
        )
      ).filter((t): t is RaidInstance & { token: string } => t !== null);

      await sendMessageToChannel(
        discordClient,
        serverRaidEvent.channelId,
        createSoftReserveMessage(associatedSoftReserves, raids),
      );
    }),
  );
}
