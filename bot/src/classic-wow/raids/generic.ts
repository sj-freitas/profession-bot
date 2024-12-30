/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-extend-native */
import { Class } from "../../raider-io/types";
import { CLASS_ROLE_MAP } from "../class-role";
import { Character, Group, MAX_GROUP_SIZE, Raid } from "../raid-assignment";
import {
  getRaidsortLuaAssignment,
  pickOneAtRandomAndRemoveFromArray,
} from "./utilts";

const MAX_NUMBER_OF_TANKS_PER_GROUP = 2;
const MAX_NUMBER_OF_HEALERS_PER_GROUP = 2;

type FilterTwoResult<T> = [predicated: T[], notPredicated: T[]];
type Predicate<T> = (value: T, index: number, array: T[]) => boolean;

function negatePredicate<T>(predicate: Predicate<T>): Predicate<T> {
  return (value: T, index: number, array: T[]) =>
    !predicate(value, index, array);
}

export function filterTwo<T>(
  array: T[],
  predicate: Predicate<T>,
): FilterTwoResult<T> {
  return [array.filter(predicate), array.filter(negatePredicate(predicate))];
}

export function makeAssignments(roster: Character[]): Raid {
  // Ideally we want one group with the tanks
  // Each group needs to be sorted as melee group, caster group
  // Buffer casters buff caster group
  // Melee buffers buff melee group
  // Need to find out how many groups we make
  // Hunters are odd balls and can be spread around
  const [allHealers, nonHealers] = filterTwo(
    roster,
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
    (t) => t.role === "Melee",
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
  const pureMeleeGroups = new Array(numberOfMeleeGroups)
    .fill(null)
    .map((_, index) => {
      const currGroup: Character[] = [];
      const meleeBuffer = pickOneAtRandomAndRemoveFromArray(meleeBuffers);
      if (meleeBuffer) {
        currGroup.push(meleeBuffer);
      }
      const paladin = pickOneAtRandomAndRemoveFromArray(meleePaladins);
      if (paladin) {
        currGroup.push(paladin);
      }
      const druid = pickOneAtRandomAndRemoveFromArray(meleeDruids);
      if (druid) {
        currGroup.push(druid);
      }

      for (let i = 0; i < MAX_NUMBER_OF_TANKS_PER_GROUP; i += 1) {
        const tank = pickOneAtRandomAndRemoveFromArray(meleeTanks);
        if (!tank) {
          break;
        }
        currGroup.push(tank);
      }

      for (let i = currGroup.length; i < MAX_GROUP_SIZE; i += 1) {
        const meleeDps = pickOneAtRandomAndRemoveFromArray(remainingMelee);
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
    .map((_, index) => {
      const currGroup: Character[] = [];
      const shadowPriest = pickOneAtRandomAndRemoveFromArray(shadowPriests);
      if (shadowPriest) {
        currGroup.push(shadowPriest);
      }
      const moonkin = pickOneAtRandomAndRemoveFromArray(moonkins);
      if (moonkin) {
        currGroup.push(moonkin);
      }
      const paladin = pickOneAtRandomAndRemoveFromArray(healerPaladins);
      if (paladin) {
        currGroup.push(paladin);
      }

      const remainingAmountOfHealersForGroup =
        MAX_NUMBER_OF_HEALERS_PER_GROUP -
        currGroup.filter((t) => t.role === "Healer").length;
      for (let i = 0; i < remainingAmountOfHealersForGroup; i += 1) {
        const healer = pickOneAtRandomAndRemoveFromArray(remainingHealers);
        if (!healer) {
          break;
        }
        currGroup.push(healer);
      }

      for (let i = currGroup.length; i < MAX_GROUP_SIZE; i += 1) {
        const casterDps = pickOneAtRandomAndRemoveFromArray(nonBufferCasters);
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

    const currHunter = pickOneAtRandomAndRemoveFromArray(rangedHunters);
    if (!currHunter) {
      break;
    }

    notFullGroup.push(currHunter);
  }

  // If we have more than 8 groups we need to split the smaller groups ?

  return {
    groups: [
      ...groups,
      // Put any remaining hunters in a new group, probably not needed.
      ...rangedHunters.reduce<Character[][]>((acc, next) => {
        let lastGroup = acc[acc.length - 1];
        if (lastGroup === undefined || lastGroup.length === MAX_GROUP_SIZE) {
          lastGroup = [];
          acc.push(lastGroup);
        }

        lastGroup.push(next);

        return acc;
      }, []),
    ]
      .map(
        (currGroup) =>
          ({
            slots: new Array(MAX_GROUP_SIZE)
              .fill(null)
              .map((_, idx) => currGroup[idx] ?? null),
          }) as Group,
      )
      .sort(
        (group1, group2) =>
          group2.slots.filter((t) => t !== null).length -
          group1.slots.filter((t) => t !== null).length,
      ),
  };
}

export function getGenericRaidAssignment(roster: Character[]): string {
  const raid = makeAssignments(roster);

  return getRaidsortLuaAssignment(raid);
}
