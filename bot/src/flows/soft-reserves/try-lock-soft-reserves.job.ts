import { Client } from "discord.js";
import { SheetClient } from "../../integrations/sheets/config";
import { lockRaid } from "../../integrations/softres/softres-client";
import { getSoftresTokensFromEventId } from "../../discord/get-softres-token.command";
import { CONFIG } from "../../config";
import { RAID_HELPER_AUTHOR } from "../../integrations/raid-helper/constants";
import { isRaidEventInAmountOfTime } from "../time-utils";
import { fetchEvent } from "../../integrations/raid-helper/raid-helper-client";

const FIVE_MINUTES_BEFORE_RAID = 5 * 60 * 1000;
const channelIds = CONFIG.GUILD.RAID_SIGN_UP_CHANNELS;

export async function tryLockSoftreserves(
  discordClient: Client,
  sheetClient: SheetClient,
): Promise<void> {
  await Promise.all(
    channelIds.map(async (channelId) => {
      const channel = await discordClient.channels.fetch(channelId);
      if (!channel || !channel.isTextBased()) {
        return;
      }

      const messages = await channel.messages.fetch();
      const eventIds = messages
        .filter((t) => t.author.id === RAID_HELPER_AUTHOR)
        .map((t) => t.id);

      await Promise.all(
        eventIds.map(async (eventId) => {
          const raidEvent = await fetchEvent(eventId);
          if (!raidEvent) {
            // No event associated with this message.
            return;
          }
          if (!isRaidEventInAmountOfTime(raidEvent, FIVE_MINUTES_BEFORE_RAID)) {
            return;
          }

          const softresInfo = await getSoftresTokensFromEventId(
            eventId,
            sheetClient,
          );

          if (softresInfo.length === 0) {
            return;
          }

          await Promise.all(
            softresInfo.map(
              async ({ raidId, token }) => await lockRaid(raidId, token),
            ),
          );
        }),
      );
    }),
  );
}
