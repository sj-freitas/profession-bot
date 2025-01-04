import { Client } from "discord.js";
import {
  createAndAdvertiseSoftres,
  createOfficerSoftReserveMessage,
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

export async function pollChannelsForSoftReserves(
  discordClient: Client,
  channelIds: string[],
  officerChannelId?: string,
): Promise<void> {
  const channelsIdsSet = new Set(channelIds);
  const events = await fetchServerEvents(CONFIG.GUILD.DISCORD_SERVER_ID);
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

      const hasSoftReserveMessage = messagesOfBot.find((t) =>
        isSoftReserveMessage(t.content),
      );
      if (hasSoftReserveMessage) {
        // Channel already has soft reserves, nothing to do here.
        return;
      }

      // No message exists, we can also see if a record already exists for this raid
      const raidEvent = await raidInfo.getValueById(serverRaidEvent.id);
      if (
        !raidEvent ||
        raidEvent.softresToken.split(";").filter((t) => Boolean(t.trim()))
          .length === 0
      ) {
        await createAndAdvertiseSoftres(
          discordClient,
          serverRaidEvent,
          officerChannelId,
        );
        return;
      }

      const softReserveTokens = raidEvent.softresToken.split(";");
      const softReserves = raidEvent.softresId.split(";").map((t, idx) => ({
        raidId: t,
        token: softReserveTokens[idx],
      }));

      const associatedSoftReserves = await Promise.all(
        softReserves.map(async (t) => ({
          ...(await getRaid(t.raidId)),
          token: t.token,
        })),
      );

      await sendMessageToChannel(
        discordClient,
        serverRaidEvent.channelId,
        createSoftReserveMessage(associatedSoftReserves, raids),
      );
      if (officerChannelId) {
        await sendMessageToChannel(
          discordClient,
          officerChannelId,
          createOfficerSoftReserveMessage(associatedSoftReserves, raids),
        );
      }
    }),
  );
}
