/* eslint-disable no-continue */
import { Client } from "discord.js";
import { RaidEvent } from "../../integrations/raid-helper/types";
import { Roster, toRaidAssignmentRoster } from "../roster-helper";
import { SheetClient } from "../../integrations/sheets/config";
import { CONFIG } from "../../config";
import { getInstanceInfosFromRaidEventId } from "../raid-info-utils";
import { INSTANCE_ASSIGNMENT_MAKERS } from "../../classic-wow/raids";
import { AttachmentFile } from "../../classic-wow/raids/assignment-config";
import { Character } from "../../classic-wow/raid-assignment";
import { Database } from "../../exports/mem-database";

const { INFO_SHEET, DISCORD_SERVER_ID } = CONFIG.GUILD;

interface RaidAssignmentSegments {
  title: string;
  text?: string;
  attachments?: AttachmentFile[];
  characters: Character[];
}

export async function sendAssignmentDms(
  discordClient: Client,
  sheetClient: SheetClient,
  raidEvent: RaidEvent,
  roster: Roster,
  database: Database,
): Promise<void> {
  const instanceInfos = await getInstanceInfosFromRaidEventId(
    sheetClient,
    INFO_SHEET,
    raidEvent.id,
  );
  const raidAssignmentRoster = toRaidAssignmentRoster(roster);

  // Get Assignment Data for each raid
  const assignmentData: RaidAssignmentSegments[] = (
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

        const allRaidSignUpChannelMessages: RaidAssignmentSegments[] =
          allAssignments.map((t) => ({
            characters: t.assignedCharacters ?? [],
            title: `${t.announcementTitle}`,
            text: t.announcementAssignment,
            attachments: t.files,
          }));

        return allRaidSignUpChannelMessages;
      }),
    )
  )
    .flatMap((x) => x)
    .filter(
      (currRaid): currRaid is RaidAssignmentSegments =>
        currRaid !== null && currRaid.characters.length !== 0,
    );

  // Group by Character
  const allCharacters = roster.characters.map((currCharacter) => {
    const assignmentsOfCurrCharacter = assignmentData.filter((t) =>
      t.characters.find((x) => x.name === currCharacter.name),
    );

    if (assignmentsOfCurrCharacter.length === 0) {
      return null;
    }

    return {
      currCharacter,
      assignmentsOfCurrCharacter,
    };
  });

  for (const curr of allCharacters) {
    if (curr === null) {
      continue;
    }

    const currUser = database
      .getPlayerInfos()
      .find((t) => t.discordId === curr.currCharacter.player.discordId);
    if (!currUser || !currUser.hasDmRaidAssignmentsEnabled) {
      continue;
    }

    const user = await discordClient.users.fetch(
      curr.currCharacter.player.discordId,
    );
    if (!user) {
      continue;
    }

    await user.send(
      `# Raid invites for [${raidEvent.title}](https://discord.com/channels/${DISCORD_SERVER_ID}/${raidEvent.channelId}/${raidEvent.id}) have started!\nPlease log on to ${curr.currCharacter.name}. Also please check you assignments, please check them here!`,
    );
    await Promise.all(
      curr.assignmentsOfCurrCharacter
        .filter((t) => t.text)
        .map((x) => `${x.title}\n${x.text}`)
        .filter((t): t is string => Boolean(t) && typeof t === "string")
        .map(async (assignmentMessage) => {
          await user.send(assignmentMessage);
        }),
    );
  }
}
