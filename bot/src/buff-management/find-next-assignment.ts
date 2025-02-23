import { Player } from "../integrations/sheets/get-players";

export interface GroupPreConfig {
  dmt: Player | null;
  dmf: Player | null;
  dragon: Player | null;
  zg: Player | null;
  rend: [Player | null, Player | null];
  firewater: [Player | null, Player | null];
  songflower: [Player | null, Player | null];
}

export interface GroupConfig {
  dmt: Player;
  dmf: Player;
  dragon: Player;
  zg: Player;
  rend: [Player, Player?];
  firewater: [Player, Player?];
  songflower: [Player, Player?];
}

export interface BuffAssignment {
  groups: GroupConfig[];
}

export interface History {
  assignments: BuffAssignment[];
}

export interface AssignmentInfo {
  assignees: Player[];
  durationInHours: number;
}

export interface AssignmentConfig {
  dmt: AssignmentInfo;
  dmf: AssignmentInfo;
  dragon: AssignmentInfo;
  zg: AssignmentInfo;
  rend: AssignmentInfo;
  firewater: AssignmentInfo;
  songflower: AssignmentInfo;
}

/**
 * Given the buff, it'll get as many buffers as it's needed. It'll return null places if not all spots
 * could be filled in.
 *
 * @param buffName
 * @param assignmentConfig
 * @param sortedAssignments
 */
function findPlayersForBuff(
  buffName: keyof AssignmentConfig,
  assignmentConfig: AssignmentConfig,
  sortedAssignments: string[],
  averageRaidDurationHours: number,
  numberOfGroups: number,
): (string | null)[] {
  const { durationInHours: duration, assignees } = assignmentConfig[buffName];
  const assignmentSize = (averageRaidDurationHours / duration) * numberOfGroups;
  const array: (string | null)[] = new Array(assignmentSize).fill(null);

  // Set the non null values with the available sorted players
  const assigneeSet = new Set(assignees.map((t) => t.discordHandle));
  sortedAssignments
    .filter((t) => assigneeSet.has(t))
    .forEach((t, index) => {
      array[index] = t;
    });

  return array.slice(0, assignmentSize);
}

export const RAID_DURATION_IN_HOURS = 2;

export function findNextAssignment({
  assignmentConfig,
  roster,
  history,
  numberOfGroups,
}: {
  assignmentConfig: AssignmentConfig;
  roster: Player[];
  history: History;
  numberOfGroups: number;
}): GroupPreConfig[] {
  const userBuffCounter = history.assignments.reduce(
    (counter: Map<string, number>, currAssignment: BuffAssignment) => {
      const flattenedUsersOfAssignment = currAssignment.groups.flatMap(
        (currGroup: GroupConfig) => {
          const { rend, firewater, songflower, ...rest } = currGroup;

          return [
            ...Object.values(rest),
            ...rend,
            ...firewater,
            ...songflower,
          ].filter((t) => t !== undefined);
        },
      );

      for (const curr of flattenedUsersOfAssignment) {
        const existing = counter.get(curr.discordHandle) ?? 0;

        counter.set(curr.discordHandle, existing + 1);
      }

      return counter;
    },
    new Map<string, number>(),
  );

  // Add people without history
  for (const curr of roster) {
    if (!userBuffCounter.has(curr.discordHandle)) {
      userBuffCounter.set(curr.discordHandle, 0);
    }
  }

  const sortedByLessFrequency = [...userBuffCounter.entries()]
    .sort(([, countA], [, countB]) => countA - countB)
    .map(([discordHandle]) => discordHandle);

  // Only get the people in the roster
  const rosterMap = new Map(roster.map((t) => [t.discordHandle, t]));
  const availableSortedPlayers = sortedByLessFrequency.filter((t) =>
    rosterMap.has(t),
  );

  // The plan is to get the one that buffed less,
  // recency bias can be a thing, we can address it later
  const preGroupConfig = new Map<keyof AssignmentConfig, (Player | null | undefined)[]>();
  for (const currKey of Object.keys(assignmentConfig)) {
    const buffName = currKey as keyof AssignmentConfig;
    const assignees = findPlayersForBuff(
      buffName,
      assignmentConfig,
      availableSortedPlayers,
      RAID_DURATION_IN_HOURS,
      numberOfGroups,
    ).map((t) => (t !== null && t !== undefined ? (rosterMap.get(t) ?? null) : null));

    preGroupConfig.set(buffName, assignees);
  }

  // Now we need to split the groups, we can shuffle the order around (?)
  // probably doesn't really matter
  return new Array(numberOfGroups).fill(null).map((_, index: number) => ({
    dmt: (preGroupConfig.get("dmt") ?? [])[index] ?? null,
    dmf: (preGroupConfig.get("dmf") ?? [])[index] ?? null,
    dragon: (preGroupConfig.get("dragon") ?? [])[index] ?? null,
    zg: (preGroupConfig.get("zg") ?? [])[index] ?? null,
    rend: [
      (preGroupConfig.get("rend") ?? [])[index * 2] ?? null,
      (preGroupConfig.get("rend") ?? [])[index * 2 + 1] ?? null,
    ],
    firewater: [
      (preGroupConfig.get("firewater") ?? [])[index * 2] ?? null,
      (preGroupConfig.get("firewater") ?? [])[index * 2 + 1] ?? null,
    ],
    songflower: [
      (preGroupConfig.get("songflower") ?? [])[index * 2] ?? null,
      (preGroupConfig.get("songflower") ?? [])[index * 2 + 1] ?? null,
    ],
  }));
}
