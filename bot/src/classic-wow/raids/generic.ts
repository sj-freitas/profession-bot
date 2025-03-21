import { PlayerInfo } from "../../integrations/sheets/player-info-table";
import { sortByBooleanPredicate } from "../../lib/array-utils";
import { CLASS_ROLE_MAP } from "../class-role";
import { Character, Group, MAX_GROUP_SIZE, Raid } from "../raid-assignment";
import { RaidAssignmentResult } from "./assignment-config";
import { RaidAssignmentRoster } from "./raid-assignment-roster";
import {
  exportRaidGroupsToTable,
  getCharacterToPlayerDiscordMap,
  getRaidsortLuaAssignment,
  hasAtiesh,
  sortByClasses,
} from "./utils";
import { mergeGroups } from "./utils/merge-groups";

export interface GroupReviewResult {
  groupType: "Melee" | "Ranged" | "Hybrid";
  isGroupFull: boolean;
  isIdealGroup: boolean;
}

/**
 * Helper function that given a group of characters, will review the group. If it
 * identifies the group as ranged, it'll access of the group has at least one shadow
 * priest and a balance druid. If the group is melee, it requires one paladin, one warrior and
 * one feral druid (tank or DPS).
 *
 * @param group The group to evaluate.
 * @returns A report containing the meta information about the group.
 */
export function isIdealGroup(group: Character[]): GroupReviewResult {
  const isGroupFull = group.length >= MAX_GROUP_SIZE;
  const meleeDps = group.filter(
    (t) =>
      t.role === "Melee" ||
      (t.role === "Tank" && t.class !== "Warlock") ||
      t.class === "Hunter",
  );
  const isMeleeGroup = meleeDps.length >= 3;
  const rangedDps = group.filter(
    (t) =>
      (t.role === "Ranged" || (t.role === "Tank" && t.class === "Warlock")) &&
      t.class !== "Hunter",
  );
  const isRangedGroup = rangedDps.length >= 3;
  const hasPaladin = Boolean(group.find((t) => t.class === "Paladin"));
  const hasWarrior = Boolean(group.find((t) => t.class === "Warrior"));
  const hasFeralDruid = Boolean(
    group.find(
      (t) => t.class === "Druid" && (t.role === "Tank" || t.role === "Melee"),
    ),
  );
  const hasShadowPriest = Boolean(
    group.find((t) => t.class === "Priest" && t.role === "Ranged"),
  );
  const hasBalanceDruid = Boolean(
    group.find((t) => t.class === "Druid" && t.role === "Ranged"),
  );

  if (isMeleeGroup) {
    return {
      isGroupFull,
      groupType: "Melee",
      isIdealGroup: hasPaladin && hasWarrior && hasFeralDruid,
    };
  }

  if (isRangedGroup) {
    return {
      isGroupFull,
      groupType: "Ranged",
      isIdealGroup: hasShadowPriest && hasBalanceDruid,
    };
  }

  return {
    isGroupFull,
    groupType: "Hybrid",
    isIdealGroup:
      hasPaladin &&
      hasWarrior &&
      hasFeralDruid &&
      hasShadowPriest &&
      hasBalanceDruid,
  };
}

function calculateMaximumNumberOfGroups(buffers: Character[][]): number {
  const numberOfBuffersPerKind = buffers.map((t) => t.length);

  return Math.max(...numberOfBuffersPerKind);
}

export function getMissingCharacters(
  characters: Character[],
  groups: Character[][],
): Character[] {
  const groupedCharacters = new Set(
    groups.flatMap((t) => t).map((t) => t.name),
  );

  return characters.filter((t) => !groupedCharacters.has(t.name));
}

function calculateShortEndScore(
  characterName: string,
  playerInfo: PlayerInfo,
  aggregateDataFromPLayer = false,
): number {
  const metadataOfCharacter = playerInfo.charactersMetadata.filter(
    (t) => aggregateDataFromPLayer || t.characterName === characterName,
  );

  return metadataOfCharacter
    .map((t) => t.shortEndCount)
    .reduce((res, next) => res + next, 0);
}

/**
 * This algorithm is deterministic meaning that it can be used to export the short-enders as
 * these will always be the same, but should also depend on them.
 */
export function makeAssignments({
  characters: allCharacters,
  players,
}: RaidAssignmentRoster): Raid {
  const playerCharMap = new Map(
    players
      .map((t) =>
        [t.mainName, ...t.altNames].map((x) => ({
          charName: x,
          data: {
            discordId: t.discordId,
            shortEndCount: calculateShortEndScore(x, t),
          },
        })),
      )
      .flatMap((t) => t)
      .map(({ charName, data }) => [charName, data]),
  );

  // Round Robin all of these to groups
  const characters = allCharacters.sort(
    (a, b) =>
      (playerCharMap.get(b.name)?.shortEndCount ?? 0) -
      (playerCharMap.get(a.name)?.shortEndCount ?? 0),
  );
  const paladins = characters.filter((t) => t.class === "Paladin");
  const feralDruids = characters.filter(
    (t) => t.class === "Druid" && (t.role === "Melee" || t.role === "Tank"),
  );
  const warriors = characters.filter((t) => t.class === "Warrior");

  // Figure out the number of groups
  const numberOfIdealMeleeGroups = calculateMaximumNumberOfGroups([
    paladins,
    feralDruids,
    warriors,
  ]);
  const meleeToBoost = characters.filter(
    (t) => t.class === "Rogue" || t.class === "Hunter",
  );
  const allMeleeGroups: Character[][] = new Array(numberOfIdealMeleeGroups)
    .fill(null)
    .map(() => {
      return [
        ...paladins.splice(0, 1),
        ...feralDruids.splice(0, 1),
        ...warriors.splice(0, 1),
        ...meleeToBoost.splice(0, 1),
        ...meleeToBoost.splice(0, 1),
      ];
    });
  const assignedMelee = new Set(
    allMeleeGroups.flatMap((t) => t).map((t) => t.name),
  );
  const unassignedMelee = meleeToBoost
    .filter((t) => !assignedMelee.has(t.name))
    .map((t) => [t]);

  // Healers and casters ordered by who has Atiesh
  const casters = sortByBooleanPredicate(
    characters.filter(
      (t) =>
        (t.role === "Healer" && t.class !== "Paladin") ||
        (t.role === "Ranged" && t.class !== "Hunter") ||
        (t.role === "Tank" && t.class === "Warlock"),
    ),
    (t) => hasAtiesh(t, players),
  );
  const balanceDruids = casters.filter(
    (t) => t.class === "Druid" && t.role === "Ranged",
  );
  const shadowPriests = casters.filter(
    (t) => t.class === "Priest" && t.role === "Ranged",
  );

  // Figure out the number of caster groups
  const numberOfIdealCasterGroups = calculateMaximumNumberOfGroups([
    balanceDruids,
    shadowPriests,
  ]);
  const castersToBoost = casters.filter(
    (t) => t.class === "Warlock" || t.class === "Mage" || t.role === "Healer",
  );
  const allCasterGroups: Character[][] = new Array(numberOfIdealCasterGroups)
    .fill(null)
    .map(() => {
      return [
        ...balanceDruids.splice(0, 1),
        ...shadowPriests.splice(0, 1),
        ...castersToBoost.splice(0, 1),
        ...castersToBoost.splice(0, 1),
        ...castersToBoost.splice(0, 1),
      ];
    });
  const assignedCasters = new Set(
    allCasterGroups.flatMap((t) => t).map((t) => t.name),
  );
  const unassignedCasters = castersToBoost
    .filter((t) => !assignedCasters.has(t.name))
    .map((t) => [t]);

  const compressedMelee = mergeGroups([...allMeleeGroups, ...unassignedMelee]);
  const compressedCasters = mergeGroups([
    ...allCasterGroups,
    ...unassignedCasters,
  ]);
  const allGroups: Group[] = mergeGroups([
    ...compressedMelee,
    ...compressedCasters,
  ])
    .sort((a, b) => b.length - a.length)
    .map(([p1, p2, p3, p4, p5]) => ({
      slots: [p1 ?? null, p2 ?? null, p3 ?? null, p4 ?? null, p5 ?? null],
    }));

  // Remove from max amount of players, remove the non-ideal groups first
  return {
    groups: allGroups,
  };
}

export function getShortEndersOfRaid(
  roster: RaidAssignmentRoster,
): Character[] {
  const allGroups = makeAssignments(roster).groups;
  const areIdealGroups = allGroups.map((t) => ({
    report: isIdealGroup(t.slots.filter((x): x is Character => Boolean(x))),
    group: t,
  }));
  const shortEnders = areIdealGroups
    .filter((t) => !t.report.isIdealGroup)
    .flatMap((t) => t.group.slots)
    .filter((t): t is Character => Boolean(t));

  return shortEnders;
}

interface SoulStoneAssignments {
  mainSoulStoner: Character;
  healerToSoulStone: Character;
  soulStoners: Character[];
}

export function makeWarlockSSRotation(
  roster: RaidAssignmentRoster,
): SoulStoneAssignments {
  const healerToSoulStone = sortByClasses(
    roster.characters.filter(
      (t) =>
        CLASS_ROLE_MAP[t.class][t.role].canResurrect && t.role === "Healer",
    ),
    ["Priest", "Druid", "Paladin"],
  )[0];
  const soulStoners = roster.characters.filter((t) => t.class === "Warlock");

  return {
    mainSoulStoner: soulStoners[0],
    healerToSoulStone,
    soulStoners,
  };
}

export function toSoulStoneAssignment(
  assignment: SoulStoneAssignments,
  characterPlayerMap: Map<string, PlayerInfo>,
): string {
  return `### Soul Stone rotation
Soul Stone target will be ${assignment.healerToSoulStone.name} (<@${characterPlayerMap.get(assignment.healerToSoulStone.name)?.discordId}>). <@${characterPlayerMap.get(assignment.mainSoulStoner.name)?.discordId}> will be in charge of tracking the turns of soul stones. Which will be in order:
${assignment.soulStoners.map((t, idx) => `${idx + 1}. ${t.name} (<@${characterPlayerMap.get(t.name)?.discordId}>)`).join("\n")}`;
}

export function toRwStoneAssignment(assignment: SoulStoneAssignments): string {
  return `### Raid warnings for warlock soul stone assignment
  \`/rw Soul Stone on ${assignment.healerToSoulStone.name} called by ${assignment.mainSoulStoner.name} and in order [${assignment.soulStoners.map((t) => t.name).join(" > ")}]\``;
}

// Look into languages to have slightly nicer markdown colors
// https://gist.github.com/matthewzring/9f7bbfd102003963f9be7dbcf7d40e51
export function getGenericRaidAssignment(
  roster: RaidAssignmentRoster,
): Promise<RaidAssignmentResult> {
  const characterPlayerMap = getCharacterToPlayerDiscordMap(roster.players);
  const raid = makeAssignments(roster);
  const soulStoneAssignments = makeWarlockSSRotation(roster);
  const discordSoulStoneAssignment = toSoulStoneAssignment(
    soulStoneAssignments,
    characterPlayerMap,
  );

  const dmAssignment = [
    getRaidsortLuaAssignment(raid),
    toRwStoneAssignment(soulStoneAssignments),
  ];
  const announcementAssignment = `## Raid Groups
\`\`\`prolog
${exportRaidGroupsToTable(raid)}
\`\`\`
${discordSoulStoneAssignment}`;

  const officerAssignment = `${getRaidsortLuaAssignment(raid)}
  ${toRwStoneAssignment(soulStoneAssignments)}`;

  return Promise.resolve({
    dmAssignment,
    announcementAssignment,
    officerAssignment,
  });
}
