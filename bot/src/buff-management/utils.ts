/* eslint-disable no-console */
import {
  WorldBuffAssignments,
  WorldBuffHistory,
  WorldBuffInfo,
} from "../integrations/sheets/get-buffers";
import { Player } from "../integrations/sheets/get-players";
import { AssignmentConfig, GroupConfig, History } from "./find-next-assignment";

export type BuffAssignmentEntry = {
  buff: WorldBuffInfo;
  assignees: string[];
};

export function findBuff(
  entries: BuffAssignmentEntry[],
  buff: keyof GroupConfig,
): BuffAssignmentEntry {
  const found = entries.find((t) => t.buff.shortName === buff);

  if (!found) {
    return {
      buff: {
        longName: buff,
        shortName: buff,
        duration: 0,
      },
      assignees: [],
    }
  }

  return found;
}

export function getAssignees(
  entry: BuffAssignmentEntry,
  playerData: Map<string, Player>,
): Player[] {
  const assignees = entry.assignees
    .map((t) => playerData.get(t))
    .filter((t): t is Player => Boolean(t));

  if (assignees.length === 0) {
    console.warn(
      `Unexpected mapping! ${entry.assignees.join("; ")} could not be mapped to any valid users!`,
    );
  }

  return assignees;
}

export function getFirstTwoOfArray<T>(array: T[]): [T?, T?] {
  if (array.length === 0) {
    return [];
  }

  return [array[0], array[1]];
}

export function mapRawHistory(
  rawHistory: WorldBuffHistory[],
  playerData: Map<string, Player>,
): History {
  return {
    assignments: rawHistory.map((event) => ({
      groups: event.groups.map((group) => ({
        dmt: getAssignees(findBuff(group.entries, "dmt"), playerData)[0],
        dmf: getAssignees(findBuff(group.entries, "dmf"), playerData)[0],
        dragon: getAssignees(findBuff(group.entries, "dragon"), playerData)[0],
        zg: getAssignees(findBuff(group.entries, "zg"), playerData)[0],
        rend: getFirstTwoOfArray(
          getAssignees(findBuff(group.entries, "rend"), playerData),
        ),
        firewater: getFirstTwoOfArray(
          getAssignees(findBuff(group.entries, "firewater"), playerData),
        ),
        songflower: getFirstTwoOfArray(
          getAssignees(findBuff(group.entries, "songflower"), playerData),
        ),
      })),
    })),
  };
}

export function mapRawAssignmentConfig(
  rawAssignmentConfig: WorldBuffAssignments[],
  playerData: Map<string, Player>,
): AssignmentConfig {
  const value = rawAssignmentConfig.reduce((obj, curr) => {
    const key = curr.buffInfo.shortName as keyof AssignmentConfig;

    return {
      ...obj,
      [key]: {
        assignees: curr.discordHandles.map((discordHandle) =>
          playerData.get(discordHandle),
        ),
        durationInHours: curr.buffInfo.duration,
      },
    };
  }, {} as Partial<AssignmentConfig>);

  return value as AssignmentConfig;
}
