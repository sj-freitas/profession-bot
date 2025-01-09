/* eslint-disable no-console */
import { CONFIG } from "../config";
import { Database } from "../exports/mem-database";
import {
  createEvent,
  fetchServerEvents,
} from "../integrations/raid-helper/raid-helper-client";
import { CommandHandler } from "./commandHandler";

const SEASON_OF_DISCOVERY_TEMPLATE = 37;
const { RAID_AD_HOC_SIGN_UP_CHANNEL, DISCORD_SERVER_ID } = CONFIG.GUILD;

export const handleCreateAdHocRaid: CommandHandler<Database> = async ({
  options,
  reply,
  interaction,
}): Promise<void> => {
  const leaderId = interaction.user.id;
  console.log(`leaderId = ${leaderId}`)

  const time = options.getString("time");
  if (time === null) {
    await reply("Hours should be formatted as HH:mm or hh:mm a");
    return;
  }
  const date = options.getString("date");
  if (date === null) {
    await reply("Date must be dd-MM-yyyy, example 24-12-2022");
    return;
  }
  const title = options.getString("title");
  if (title === null) {
    await reply("Failed to provide a valid title, please try another one.");
    return;
  }
  const description = options.getString("description");
  if (description === null) {
    await reply(
      "Failed to provide a valid recipe, description try another one.",
    );
    return;
  }

  const result = await createEvent(
    DISCORD_SERVER_ID,
    RAID_AD_HOC_SIGN_UP_CHANNEL,
    {
      leaderId,
      templateId: SEASON_OF_DISCOVERY_TEMPLATE,
      date,
      time,
      title,
      description,
    },
  );

  if (result !== null) {
    await reply("Raid created successfully in the ad-hoc channel");
  } else {
    await reply(
      "Raid creation failed, make sure the time and date were in the correct format",
    );
  }
};

export const handleDeleteAdHocRaid: CommandHandler<Database> = async ({
  reply,
  interaction,
}): Promise<void> => {
  const { client } = interaction;
  const leaderId = interaction.user.id;
  const allEventsOfServer = await fetchServerEvents(DISCORD_SERVER_ID);
  if (allEventsOfServer === null) {
    await reply(
      "There was an error while fetching raid data, this is likely because Raid-Helper is down.",
    );
    return;
  }

  const eventsOfAuthorAndAdHoc = (allEventsOfServer.postedEvents ?? []).filter(
    (t) =>
      t.channelId === RAID_AD_HOC_SIGN_UP_CHANNEL && t.leaderId === leaderId,
  );
  if (eventsOfAuthorAndAdHoc.length === 0) {
    await reply("No messages to delete.");
  }

  const adHocRaidChannel = await client.channels.fetch(
    RAID_AD_HOC_SIGN_UP_CHANNEL,
  );
  if (!adHocRaidChannel?.isTextBased()) {
    await reply(
      "Invalid ad-hoc-raid channel, this means that there is a problem with your server's config.",
    );
    return;
  }

  await Promise.all(
    eventsOfAuthorAndAdHoc.map(async (t) =>
      adHocRaidChannel.messages.delete(t.id),
    ),
  );
  await reply(`Deleted ${eventsOfAuthorAndAdHoc.length} event(s) in your name`);
};
