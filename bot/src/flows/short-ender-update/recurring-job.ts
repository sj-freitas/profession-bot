import { Character } from "../../classic-wow/raid-assignment";
import { INSTANCE_ASSIGNMENT_MAKERS } from "../../classic-wow/raids";
import { AssignmentConfig as RaidAssignmentConfig } from "../../classic-wow/raids/assignment-config";
import { CONFIG } from "../../config";
import { Database } from "../../exports/mem-database";
import {
  fetchEvent,
  fetchServerEvents,
} from "../../integrations/raid-helper/raid-helper-client";
import { RaidEvent } from "../../integrations/raid-helper/types";
import { CharacterMetadataUpdateConfigTable } from "../../integrations/sheets/character-metadata-updade.config";
import {
  createSheetClient,
  SheetClient,
} from "../../integrations/sheets/config";
import { getInstanceInfosFromRaidEventId } from "../raid-info-utils";
import {
  getRosterFromRaidEvent,
  toRaidAssignmentRoster,
} from "../roster-helper";
import { isRaidEventInAmountOfTime } from "../time-utils";
import { updateShortEnders } from "./update-short-enders";

const TWENTY_MINUTES_AFTER_RAID = -1 * 20 * 60 * 1000;
const { INFO_SHEET } = CONFIG.GUILD;

export async function updateShortEnderIfRaidIsOver(
  sheetClient: SheetClient,
  database: Database,
  raidEvent: RaidEvent,
) {
  if (
    !isRaidEventInAmountOfTime(
      raidEvent.startTime * 1000,
      TWENTY_MINUTES_AFTER_RAID,
    )
  ) {
    return;
  }

  const roster = await getRosterFromRaidEvent(raidEvent, database);
  const raidAssignmentRoster = toRaidAssignmentRoster(roster);
  const associatedAssignmentConfigs = (
    await getInstanceInfosFromRaidEventId(sheetClient, INFO_SHEET, raidEvent.id)
  )
    .filter((t) => t.usePointSystem)
    .map((t) => INSTANCE_ASSIGNMENT_MAKERS.get(t.raidId))
    .filter((t): t is RaidAssignmentConfig => Boolean(t));

  const allShortEnders = (
    await Promise.all(
      associatedAssignmentConfigs.map(async (assignmentConfig) => {
        const allAssignmentsOfRaid = await Promise.all(
          assignmentConfig.assignmentMakers.map(async (assignmentMaker) =>
            assignmentMaker(raidAssignmentRoster),
          ),
        );
        const shortEndersOfRaid = allAssignmentsOfRaid
          .map((t) => t.shortEnders)
          .filter((t): t is Character[] => Boolean(t) && Array.isArray(t))
          .flatMap((t) => t);

        return shortEndersOfRaid;
      }),
    )
  ).flatMap((t) => t);

  const updateTable = new CharacterMetadataUpdateConfigTable(
    sheetClient,
    CONFIG.GUILD.INFO_SHEET,
  );
  const value = await updateTable.getValueById(CONFIG.GUILD.DISCORD_SERVER_ID);
  if (value?.lastUpdatedRaidId === raidEvent.id) {
    // No need to update
    return;
  }

  await updateShortEnders(sheetClient, raidAssignmentRoster, allShortEnders);
  await updateTable.updateValue({
    id: CONFIG.GUILD.DISCORD_SERVER_ID,
    lastUpdatedRaidId: raidEvent.id,
    lastUpdate: new Date(),
  });
}

export async function pollChannelsToUpdateShortEndersAfterRaids(
  database: Database,
  channelIds: string[],
): Promise<void> {
  const channelIdsSet = new Set(channelIds);
  const sheetClient = createSheetClient();
  const serverEvents = await fetchServerEvents(CONFIG.GUILD.DISCORD_SERVER_ID);
  if (serverEvents === null) {
    return;
  }

  // Channels with raids
  const trackedServerEvents = (serverEvents.postedEvents ?? []).filter((t) =>
    channelIdsSet.has(t.channelId),
  );

  await Promise.all(
    trackedServerEvents.map(async (trackedEvent) => {
      const raidEvent = await fetchEvent(trackedEvent.id);
      if (!raidEvent) {
        return;
      }
      if (!raidEvent.startTime) {
        return;
      }

      await updateShortEnderIfRaidIsOver(sheetClient, database, raidEvent);
    }),
  );
}
