import { AttachmentBuilder, Client } from "discord.js";
import { RaidEvent } from "../../integrations/raid-helper/types";
import { Roster, toRaidAssignmentRoster } from "../roster-helper";
import { isRaidEventInAmountOfTime } from "../time-utils";
import { SheetClient } from "../../integrations/sheets/config";
import { CONFIG } from "../../config";
import { getInstanceInfosFromRaidEventId } from "../raid-info-utils";
import { INSTANCE_ASSIGNMENT_MAKERS } from "../../classic-wow/raids";
import { createOrEditDiscordMessage } from "../../discord/utils";
import { AttachmentFile } from "../../classic-wow/raids/assignment-config";

const SIX_HOURS = 6 * 60 * 60 * 1000;
const { INFO_SHEET, STAFF_RAID_CHANNEL_ID } = CONFIG.GUILD;

interface RaidAssignmentSegments {
  tag: string;
  text?: string;
  attachments?: AttachmentFile[];
}

interface AssignmentMessage {
  officerChannelMessages: RaidAssignmentSegments[];
  raidSignUpChannelMessages: RaidAssignmentSegments[];
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

        const allOfficerChannelMessages: RaidAssignmentSegments[] =
          allAssignments.map((t, idx) => ({
            tag: `## Assignments for ${currRaid.raidName} ${idx + 1}/${allAssignments.length}`,
            text: t.officerAssignment,
            attachments: t.files,
          }));
        const allRaidSignUpChannelMessages: RaidAssignmentSegments[] =
          allAssignments.map((t, idx) => ({
            tag: `## Assignments for ${currRaid.raidName} ${idx + 1}/${allAssignments.length}`,
            text: t.announcementAssignment,
            attachments: t.files,
          }));

        const assignmentMessageOfRaid: AssignmentMessage = {
          officerChannelMessages: allOfficerChannelMessages,
          raidSignUpChannelMessages: allRaidSignUpChannelMessages,
        };

        return assignmentMessageOfRaid;
      }),
    )
  ).filter((currRaid): currRaid is AssignmentMessage => currRaid !== null);

  for (const curr of assignmentData) {
    const {
      officerChannelMessages: officerChannelMessage,
      raidSignUpChannelMessages: raidSignUpChannelMessage,
    } = curr;
    if (officerChannelMessage.length > 0) {
      for (const currSegment of officerChannelMessage) {
        const { tag, text, attachments } = currSegment;
        await createOrEditDiscordMessage(
          discordClient,
          STAFF_RAID_CHANNEL_ID,
          tag,
          `${tag}
${text}`,
          attachments?.map(
            (t) => new AttachmentBuilder(t.attachment, { name: t.name }),
          ),
        );
      }
    }

    if (raidSignUpChannelMessage.length > 0) {
      for (const currSegment of raidSignUpChannelMessage) {
        const { tag, text, attachments } = currSegment;
        await createOrEditDiscordMessage(
          discordClient,
          raidEvent.channelId,
          tag,
          `${tag}
${text}`,
          attachments?.map(
            (t) => new AttachmentBuilder(t.attachment, { name: t.name }),
          ),
        );
      }
    }
  }
}
