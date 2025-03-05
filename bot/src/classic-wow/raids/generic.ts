import { Class } from "../../integrations/raider-io/types";
import { PlayerInfo } from "../../integrations/sheets/player-info-table";
import { filterTwo } from "../../lib/array-utils";
import { CLASS_ROLE_MAP } from "../class-role";
import {
  Character,
  Group,
  GroupSlots,
  MAX_GROUP_SIZE,
  Raid,
} from "../raid-assignment";
import { RaidAssignmentResult } from "./assignment-config";
import { RaidAssignmentRoster } from "./raid-assignment-roster";
import {
  exportRaidGroupsToTable,
  getCharacterToPlayerDiscordMap,
  getRaidsortLuaAssignment,
  pickFirstAndRemoveFromArray,
} from "./utils";

const MAX_NUMBER_OF_TANKS_PER_GROUP = 1;
const MAX_NUMBER_OF_HEALERS_PER_GROUP = 2;

function tryMergeGroups(groups: Group[]): Group[] {
  const mergedGroups: Group[] = [];
  const remainingGroups = [...groups];

  while (remainingGroups.length > 0) {
    const currentGroup = remainingGroups.shift();

    if (!currentGroup) {
      // eslint-disable-next-line no-continue
      continue;
    }

    let merged = false;

    for (let i = 0; i < mergedGroups.length; i += 1) {
      if (
        mergedGroups[i].slots.length + currentGroup.slots.length <=
        MAX_GROUP_SIZE
      ) {
        mergedGroups[i].slots = mergedGroups[i].slots.concat(
          currentGroup.slots,
        ) as GroupSlots;
        merged = true;
        break;
      }
    }

    if (!merged) {
      mergedGroups.push(currentGroup);
    }
  }

  return mergedGroups;
}

export function makeAssignments({ characters }: RaidAssignmentRoster): Raid {
  // Ideally we want one group with the tanks
  // Each group needs to be sorted as melee group, caster group
  // Buffer casters buff caster group
  // Melee buffers buff melee group
  // Need to find out how many groups we make
  // Hunters are odd balls and can be spread around
  const [allHealers, nonHealers] = filterTwo(
    characters,
    (t) => t.role === "Healer",
  );
  const [healerPaladins, remainingHealers] = filterTwo(
    allHealers,
    (t) => t.class === "Paladin",
  );
  // Including warlocks here because of warlock tanks since they are somewhat different
  const [allRanged, nonCasters] = filterTwo(
    nonHealers,
    (t) => t.role === "Ranged" || t.class === "Warlock",
  );
  const [allMelee, meleeTanks] = filterTwo(
    nonCasters,
    (t) => t.role === "Melee" || (t.role === "Tank" && t.class === "Druid"),
  );
  const [meleeBuffers, nonBufferMelee] = filterTwo(
    allMelee,
    (t) => CLASS_ROLE_MAP[t.class][t.role].canBuff,
  );
  const [meleePaladins, nonBufferMeleeExcludingPaladins] = filterTwo(
    nonBufferMelee,
    (t) => t.class === "Paladin",
  );
  const [meleeDruids, remainingMelee] = filterTwo(
    nonBufferMeleeExcludingPaladins,
    (t) => t.class === "Druid",
  );

  // Final groups
  const [rangedHunters, allCasters] = filterTwo(
    allRanged,
    (t) => t.class === "Hunter",
  );
  const [casterBuffers, nonBufferCasters] = filterTwo(
    allCasters,
    (t) => CLASS_ROLE_MAP[t.class][t.role].canBuff,
  );
  const [shadowPriests, remainingCasters] = filterTwo(
    casterBuffers,
    (t) => t.class === "Priest",
  );
  const [moonkins, miscBufferCasters] = filterTwo(
    remainingCasters,
    (t) => t.class === "Druid",
  );

  nonBufferCasters.push(...miscBufferCasters);

  // rangedHunters,
  // nonBufferCasters,  allHealers, shadowPriests, moonkins,
  // meleeTanks, meleeBuffers, remainingMelee, meleePaladins, meleeDruids

  // Separate the healers the by class
  const healersGroupedByClass = new Map<Class, Character[]>();
  allHealers.forEach((currHealer) => {
    const existing = healersGroupedByClass.get(currHealer.class) ?? [];

    existing.push(currHealer);
    healersGroupedByClass.set(currHealer.class, existing);

    return healersGroupedByClass;
  });

  // We should try making 1 paladin per group too if possible
  const numberOfMeleeGroups = Math.ceil(nonCasters.length / MAX_GROUP_SIZE);
  const pureMeleeGroups = new Array(numberOfMeleeGroups).fill(null).map(() => {
    const currGroup: Character[] = [];
    const meleeBuffer = pickFirstAndRemoveFromArray(meleeBuffers);
    if (meleeBuffer) {
      currGroup.push(meleeBuffer);
    }

    // Paladins give horn buff, make them sure they are in melee groups.
    // If there aren't sufficient melee paladins, use the healer ones.
    const paladin =
      pickFirstAndRemoveFromArray(meleePaladins) ??
      pickFirstAndRemoveFromArray(healerPaladins);
    if (paladin) {
      currGroup.push(paladin);
    }
    const druid = pickFirstAndRemoveFromArray(meleeDruids);
    if (druid) {
      currGroup.push(druid);
    }

    for (let i = 0; i < MAX_NUMBER_OF_TANKS_PER_GROUP; i += 1) {
      const tank = pickFirstAndRemoveFromArray(meleeTanks);
      if (!tank) {
        break;
      }
      currGroup.push(tank);
    }

    for (let i = currGroup.length; i < MAX_GROUP_SIZE; i += 1) {
      const meleeDps = pickFirstAndRemoveFromArray(remainingMelee);
      if (!meleeDps) {
        break;
      }
      currGroup.push(meleeDps);
    }

    return currGroup;
  });

  const [completeMeleeGroups, incompleteMeleeGroups] = filterTwo(
    pureMeleeGroups,
    (t) => t.length === MAX_GROUP_SIZE,
  );

  const ungroupedMelee = incompleteMeleeGroups.flatMap((t) => t);
  ungroupedMelee.push(
    ...remainingMelee,
    ...meleeTanks,
    ...meleePaladins,
    ...meleeBuffers,
    ...meleeDruids,
  );

  const meleeGroups = [
    ...completeMeleeGroups,
    ...ungroupedMelee.reduce<Character[][]>((acc, next) => {
      let lastGroup = acc[acc.length - 1];
      if (lastGroup === undefined || lastGroup.length === MAX_GROUP_SIZE) {
        lastGroup = [];
        acc.push(lastGroup);
      }

      lastGroup.push(next);

      return acc;
    }, []),
  ];

  const numberOfCasterGroups = Math.ceil(
    (allCasters.length + allHealers.length) / MAX_GROUP_SIZE,
  );
  const pureCasterGroups = new Array(numberOfCasterGroups)
    .fill(null)
    .map(() => {
      const currGroup: Character[] = [];
      const shadowPriest = pickFirstAndRemoveFromArray(shadowPriests);
      if (shadowPriest) {
        currGroup.push(shadowPriest);
      }
      const moonkin = pickFirstAndRemoveFromArray(moonkins);
      if (moonkin) {
        currGroup.push(moonkin);
      }
      const paladin = pickFirstAndRemoveFromArray(healerPaladins);
      if (paladin) {
        currGroup.push(paladin);
      }

      const remainingAmountOfHealersForGroup =
        MAX_NUMBER_OF_HEALERS_PER_GROUP -
        currGroup.filter((t) => t.role === "Healer").length;
      for (let i = 0; i < remainingAmountOfHealersForGroup; i += 1) {
        const healer = pickFirstAndRemoveFromArray(remainingHealers);
        if (!healer) {
          break;
        }
        currGroup.push(healer);
      }

      for (let i = currGroup.length; i < MAX_GROUP_SIZE; i += 1) {
        const casterDps = pickFirstAndRemoveFromArray(nonBufferCasters);
        if (!casterDps) {
          break;
        }
        currGroup.push(casterDps);
      }

      return currGroup;
    });

  const [completeCasterGroups, incompleteCasterGroups] = filterTwo(
    pureCasterGroups,
    (t) => t.length === MAX_GROUP_SIZE,
  );

  const ungroupedCasters = incompleteCasterGroups.flatMap((t) => t);
  ungroupedCasters.push(
    ...remainingHealers,
    ...nonBufferCasters,
    ...healerPaladins,
    ...moonkins,
    ...shadowPriests,
  );

  const casterGroups = [
    ...completeCasterGroups,
    ...ungroupedCasters.reduce<Character[][]>((acc, next) => {
      let lastGroup = acc[acc.length - 1];
      if (lastGroup === undefined || lastGroup.length === MAX_GROUP_SIZE) {
        lastGroup = [];
        acc.push(lastGroup);
      }

      lastGroup.push(next);

      return acc;
    }, []),
  ];

  const groups = [...meleeGroups, ...casterGroups];

  // Distribute all hunters through free slots in groups
  const numberOfHunters = rangedHunters.length;
  for (let i = 0; i < numberOfHunters; i += 1) {
    const notFullGroup = groups.find((t) => t.length !== MAX_GROUP_SIZE);
    if (!notFullGroup) {
      break;
    }

    const currHunter = pickFirstAndRemoveFromArray(rangedHunters);
    if (!currHunter) {
      break;
    }

    notFullGroup.push(currHunter);
  }

  const hunterGroups = rangedHunters.reduce<Character[][]>((acc, next) => {
    let lastGroup = acc[acc.length - 1];
    if (lastGroup === undefined || lastGroup.length === MAX_GROUP_SIZE) {
      lastGroup = [];
      acc.push(lastGroup);
    }

    lastGroup.push(next);

    return acc;
  }, []);

  // If we have more than 8 groups we need to split the smaller groups ?

  const merged = tryMergeGroups(
    [...groups, ...hunterGroups].map((t) => ({ slots: t }) as Group),
  );
  const adjustedGroups = merged.map(
    (currGroup) =>
      ({
        slots: new Array(MAX_GROUP_SIZE)
          .fill(null)
          .map((_, idx) => currGroup.slots[idx] ?? null),
      }) as Group,
  );

  return {
    groups: adjustedGroups.sort(
      (group1, group2) =>
        group2.slots.filter((t) => t !== null).length -
        group1.slots.filter((t) => t !== null).length,
    ),
  };
}

interface SoulStoneAssignments {
  mainSoulStoner: Character;
  healerToSoulStone: Character;
  soulStoners: Character[];
}

export function makeWarlockSSRotation(
  roster: RaidAssignmentRoster,
): SoulStoneAssignments {
  const healerToSoulStone = roster.characters.filter(
    (t) =>
      CLASS_ROLE_MAP[t.class][t.role].canResurrect &&
      t.role === "Healer" &&
      t.class !== "Paladin",
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
Soul Stone target will be <@${characterPlayerMap.get(assignment.healerToSoulStone.name)?.discordId}>. <@${characterPlayerMap.get(assignment.mainSoulStoner.name)?.discordId}> will be in charge of tracking the turns of soul stones. Which will be in order:
${assignment.soulStoners.map((t, idx) => `${idx + 1}. <@${characterPlayerMap.get(t.name)?.discordId}>`).join("\n")}`;
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
  ${toRwStoneAssignment}`;

  return Promise.resolve({
    dmAssignment,
    announcementAssignment,
    officerAssignment,
  });
}
