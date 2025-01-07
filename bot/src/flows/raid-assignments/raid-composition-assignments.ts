import { Client } from "discord.js";
import { RaidEvent } from "../../integrations/raid-helper/types";
import { Roster, toRaidAssignmentRoster } from "../roster-helper";
import { isRaidEventInAmountOfTime } from "../time-utils";
import { CONFIG } from "../../config";
import {
  createOrEditDiscordMessage,
  findMessageOfBotInHistory,
} from "../../discord/utils";
import { getGenericRaidAssignment } from "../../classic-wow/raids/generic";

const SIX_HOURS = 6 * 60 * 60 * 1000;
const { DISCORD_SERVER_ID, STAFF_RAID_CHANNEL_ID } = CONFIG.GUILD;

function formatDateToCET(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "CET",
    hour12: false,
  };

  const formatter = new Intl.DateTimeFormat("en-UK", options);
  return formatter.format(date).replace(/,/g, "");
}

function getMessageTag(raidEvent: RaidEvent): string {
  return `Setup for ${formatDateToCET(new Date(raidEvent.startTime * 1000))}`;
}

export async function raidCompositionMessageExists(
  discordClient: Client,
  raidEvent: RaidEvent,
): Promise<boolean> {
  const raidCompositionAndAssignmentsMessageTag = `# ${getMessageTag(raidEvent)}`;

  return Boolean(
    await findMessageOfBotInHistory(
      discordClient,
      raidEvent.channelId,
      raidCompositionAndAssignmentsMessageTag,
    ),
  );
}

export async function tryPostRaidComposition(
  discordClient: Client,
  raidEvent: RaidEvent,
  roster: Roster,
): Promise<void> {
  // Check if it's 6 hours before the raid
  if (!isRaidEventInAmountOfTime(raidEvent, SIX_HOURS)) {
    return;
  }

  const messageTitle = getMessageTag(raidEvent);
  const raidAssignmentRoster = toRaidAssignmentRoster(roster);

  const { officerAssignment, announcementAssignment } =
    await getGenericRaidAssignment(raidAssignmentRoster);

  const raidEventUrl = `[${messageTitle}](https://discord.com/channels/${DISCORD_SERVER_ID}/${raidEvent.channelId}/${raidEvent.id})`;

  if (officerAssignment) {
    const officerMessage = `# ${raidEventUrl}
${officerAssignment}`;

    await createOrEditDiscordMessage(
      discordClient,
      STAFF_RAID_CHANNEL_ID,
      `# ${raidEventUrl}`,
      officerMessage,
    );
  }

  if (announcementAssignment) {
    const raidSignUpMessage = `# ${messageTitle}
${announcementAssignment}`;

    await createOrEditDiscordMessage(
      discordClient,
      raidEvent.channelId,
      `# ${messageTitle}`,
      raidSignUpMessage,
    );
  }
}
