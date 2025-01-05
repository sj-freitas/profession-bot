import { Client } from "discord.js";
import { RaidEvent } from "../../integrations/raid-helper/types";
import { Roster, toRaidAssignmentRoster } from "../roster-helper";
import { isRaidEventInAmountOfTime } from "../time-utils";
import { SheetClient } from "../../integrations/sheets/config";
import { CONFIG } from "../../config";
import { getInstanceInfosFromRaidEventId } from "../raid-info-utils";
import { INSTANCE_ASSIGNMENT_MAKERS } from "../../classic-wow/raids";
import { createOrEditDiscordMessage } from "../../discord/utils";

const THREE_DAYS_BEFORE_RAID = 6 * 60 * 60 * 1000;
const { INFO_SHEET, STAFF_RAID_CHANNEL_ID } = CONFIG.GUILD;

interface AssignmentMessage {
  messageTag: string;
  officerChannelMessage?: string;
  raidSignUpChannelMessage?: string;
}

export async function tryPostRaidComposition(
  discordClient: Client,
  sheetClient: SheetClient,
  raidEvent: RaidEvent,
  roster: Roster,
): Promise<void> {
  // Check if it's 3 days before the raid
  if (!isRaidEventInAmountOfTime(raidEvent, THREE_DAYS_BEFORE_RAID)) {
    return;
  }

  const instanceInfos = await getInstanceInfosFromRaidEventId(
    sheetClient,
    INFO_SHEET,
    raidEvent.id,
  );
  const raidAssignmentRoster = toRaidAssignmentRoster(roster);

  // Get Assignment Data for each raid
  const assignmentData: AssignmentMessage[] = instanceInfos
    .map((currRaid) => {
      const raidConfig = INSTANCE_ASSIGNMENT_MAKERS.get(currRaid.raidId);

      if (!raidConfig) {
        return null;
      }

      const allAssignments = raidConfig.assignmentMakers.map((makeAssignment) =>
        makeAssignment(raidAssignmentRoster),
      );

      const allOfficerChannelMessages = allAssignments
        .map((t) => t.officerAssignment)
        .filter((t): t is string => Boolean(t));
      const allRaidSignUpChannelMessages = allAssignments
        .map((t) => t.announcementAssignment)
        .filter((t): t is string => Boolean(t));

      const officerChannelMessage =
        allOfficerChannelMessages.length >= 0
          ? `## Assignments for ${currRaid.raidName}
${allOfficerChannelMessages.join("\n\n")}`
          : undefined;
      const raidSignUpChannelMessage =
        allRaidSignUpChannelMessages.length >= 0
          ? `## Assignments for ${currRaid.raidName}
${allRaidSignUpChannelMessages.join("\n\n")}`
          : undefined;

      const assignmentMessageOfRaid: AssignmentMessage = {
        messageTag: `## Assignments for ${currRaid.raidName}`,
        officerChannelMessage,
        raidSignUpChannelMessage,
      };

      return assignmentMessageOfRaid;
    })
    .filter((currRaid): currRaid is AssignmentMessage => currRaid !== null);

  for (const curr of assignmentData) {
    const { officerChannelMessage, raidSignUpChannelMessage, messageTag } =
      curr;
    if (officerChannelMessage) {
      await createOrEditDiscordMessage(
        discordClient,
        STAFF_RAID_CHANNEL_ID,
        messageTag,
        officerChannelMessage,
      );
    }

    if (raidSignUpChannelMessage) {
      await createOrEditDiscordMessage(
        discordClient,
        raidEvent.channelId,
        messageTag,
        raidSignUpChannelMessage,
      );
    }
  }
}
