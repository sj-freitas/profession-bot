import { Client } from "discord.js";
import { RaidEvent } from "../../integrations/raid-helper/types";
import { Roster, toRaidAssignmentRoster } from "../roster-helper";
import { isRaidEventInAmountOfTime } from "../time-utils";
import { SheetClient } from "../../integrations/sheets/config";
import { CONFIG } from "../../config";
import { getInstanceInfosFromRaidEventId } from "../raid-info-utils";
import { INSTANCE_ASSIGNMENT_MAKERS } from "../../classic-wow/raids";
import { createOrEditDiscordMessage } from "../../discord/utils";

const SIX_HOURS = 6 * 60 * 60 * 1000;
const { INFO_SHEET, STAFF_RAID_CHANNEL_ID } = CONFIG.GUILD;

interface RaidAssignmentSegments {
  tag: string;
  segments: string[];
}

interface AssignmentMessage {
  officerChannelMessage: RaidAssignmentSegments;
  raidSignUpChannelMessage: RaidAssignmentSegments;
}

export async function tryPostFightAssignments(
  discordClient: Client,
  sheetClient: SheetClient,
  raidEvent: RaidEvent,
  roster: Roster,
): Promise<void> {
  // Check if it's 6 hours before the raid
  if (!isRaidEventInAmountOfTime(raidEvent, SIX_HOURS)) {
    return;
  }

  const instanceInfos = await getInstanceInfosFromRaidEventId(
    sheetClient,
    INFO_SHEET,
    raidEvent.id,
  );
  const raidAssignmentRoster = toRaidAssignmentRoster(roster);

  // Get Assignment Data for each raid
  const assignmentData: AssignmentMessage[] = (
    await Promise.all(
      instanceInfos.map(async (currRaid) => {
        const raidConfig = INSTANCE_ASSIGNMENT_MAKERS.get(currRaid.raidId);

        if (!raidConfig) {
          return null;
        }

        const allAssignments = await Promise.all(
          raidConfig.assignmentMakers.map((makeAssignment) =>
            makeAssignment(raidAssignmentRoster),
          ),
        );

        const allOfficerChannelMessages = allAssignments
          .map((t) => t.officerAssignment)
          .filter((t): t is string => Boolean(t));
        const allRaidSignUpChannelMessages = allAssignments
          .map((t) => t.announcementAssignment)
          .filter((t): t is string => Boolean(t));

        // Split this damn
        const officerChannelMessage = {
          tag: `## Assignments for ${currRaid.raidName}`,
          segments: allOfficerChannelMessages,
        };
        const raidSignUpChannelMessage = {
          tag: `## Assignments for ${currRaid.raidName}`,
          segments: allRaidSignUpChannelMessages,
        };

        const assignmentMessageOfRaid: AssignmentMessage = {
          officerChannelMessage,
          raidSignUpChannelMessage,
        };

        return assignmentMessageOfRaid;
      }),
    )
  ).filter((currRaid): currRaid is AssignmentMessage => currRaid !== null);

  for (const curr of assignmentData) {
    const { officerChannelMessage, raidSignUpChannelMessage } = curr;
    if (officerChannelMessage.segments.length > 0) {
      let i = 1;
      for (const currSegment of officerChannelMessage.segments) {
        const tag = `${officerChannelMessage.tag} ${i}/${officerChannelMessage.segments.length}`;
        await createOrEditDiscordMessage(
          discordClient,
          STAFF_RAID_CHANNEL_ID,
          tag,
          `${tag}
${currSegment}`,
        );
        i += 1;
      }
    }

    if (raidSignUpChannelMessage.segments.length > 0) {
      let i = 1;
      for (const currSegment of raidSignUpChannelMessage.segments) {
        const tag = `${raidSignUpChannelMessage.tag} ${i}/${raidSignUpChannelMessage.segments.length}`;
        await createOrEditDiscordMessage(
          discordClient,
          raidEvent.channelId,
          tag,
          `${tag}
${currSegment}`,
        );
        i += 1;
      }
    }
  }
}
