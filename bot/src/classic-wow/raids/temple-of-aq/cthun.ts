import { CLASS_ROLE_MAP, isMeleeCharacter } from "../../class-role";
import {
  ALL_RAID_TARGETS,
  Character,
  Group,
  Raid,
} from "../../raid-assignment";
import {
  exportRaidGroupsToTable,
  exportToLuaTable,
  pickOneAtRandomAndRemoveFromArray,
} from "../utilts";

export const IDEAL_NUMBER_OF_MELEE_PER_GROUP = 2;
export const ABSOLUTE_MAXIMUM_AMOUNT_OF_MELEE_IN_GROUP = 3;

export function makeAssignments(roster: Character[]): Raid {
  const allHealers = roster.filter((t) => t.role === "Healer");
  const allMeleeBuffers = roster
    .filter(isMeleeCharacter)
    .filter((t) => CLASS_ROLE_MAP[t.class][t.role].canBuff);
  const remainingMelee = roster
    .filter(isMeleeCharacter)
    .filter((t) => !CLASS_ROLE_MAP[t.class][t.role].canBuff);
  const allRangedBuffers = roster
    .filter((t) => t.role === "Ranged")
    .filter((t) => CLASS_ROLE_MAP[t.class][t.role].canBuff);
  const remainingRanged = roster
    .filter(
      (t) =>
        (t.role === "Ranged" && t.class !== "Hunter") || t.class === "Warlock",
    )
    .filter((t) => !CLASS_ROLE_MAP[t.class][t.role].canBuff);

  // Ranged Hunters are a bit of an oddity since they don't benefit from buffs
  // They shouldn't get prioritized slots.
  const rangedHunters = roster.filter(
    (t) => t.role === "Ranged" && t.class === "Hunter",
  );

  const numberOfGroups = Math.min(
    Math.floor(
      (allMeleeBuffers.length + remainingMelee.length) /
        IDEAL_NUMBER_OF_MELEE_PER_GROUP,
    ),
    8,
  );

  const groups = new Array(numberOfGroups).fill(null).map(() => {
    const slots: Character[] = [];
    const firstBuffer = pickOneAtRandomAndRemoveFromArray(allMeleeBuffers);

    if (firstBuffer !== null) {
      slots.push(firstBuffer);
    }

    for (let i = slots.length; i < IDEAL_NUMBER_OF_MELEE_PER_GROUP; i += 1) {
      const meleeDps =
        pickOneAtRandomAndRemoveFromArray(remainingMelee) ??
        pickOneAtRandomAndRemoveFromArray(allMeleeBuffers);

      if (meleeDps !== null) {
        slots.push(meleeDps);
      } else {
        // Reached the limit of the melee DPS, that's a good thing.
        break;
      }
    }

    // Assign healers at 1 per group max.
    const healer = pickOneAtRandomAndRemoveFromArray(allHealers);

    if (healer !== null) {
      slots.push(healer);
    }

    const rangedBuffer = pickOneAtRandomAndRemoveFromArray(allRangedBuffers);

    if (rangedBuffer) {
      slots.push(rangedBuffer);
    }

    for (let i = slots.length; i < 5; i += 1) {
      const rangedDps = pickOneAtRandomAndRemoveFromArray(remainingRanged);

      if (rangedDps !== null) {
        slots.push(rangedDps);
      } else {
        // Reached the limit of the melee DPS, that's a good thing.
        break;
      }
    }

    return {
      slots,
    };
  });

  // Spread the remaining members through all groups
  const allUnassignedPeople = [
    ...allHealers,
    ...allRangedBuffers,
    ...remainingRanged,
    ...rangedHunters,
  ];
  const allUnassignedMelee = [...allMeleeBuffers, ...remainingMelee];
  const refinedGroups: Group[] = groups.map(({ slots }) => {
    const remainingSlots = 5 - slots.length;

    if (remainingSlots === 0 || allUnassignedPeople.length === 0) {
      return { slots } as Group;
    }

    const remainingMeleeSlots =
      ABSOLUTE_MAXIMUM_AMOUNT_OF_MELEE_IN_GROUP -
      slots.filter(isMeleeCharacter).length;

    for (let i = 0; i < remainingMeleeSlots; i += 1) {
      const nextMelee = pickOneAtRandomAndRemoveFromArray(allUnassignedMelee);

      if (nextMelee != null) {
        slots.push(nextMelee);
      }
    }

    for (let i = slots.length; i < 5; i += 1) {
      const nextMember = pickOneAtRandomAndRemoveFromArray(allUnassignedPeople);

      if (nextMember !== null) {
        slots.push(nextMember);
      } else {
        break;
      }
    }

    return { slots } as Group;
  });

  return {
    groups: refinedGroups,
  };
}

export function exportToDiscord(composition: Raid): string {
  const raidTargets = Object.values(ALL_RAID_TARGETS).reverse();

  return `\`\`\`
## C'thun composition
Check your positioning on [this map](https://discord.com/channels/1170959696174272663/1266480999781502976/1321583474641076284)
Each melee has a "group leader" stack on top of your group's leader.

${exportRaidGroupsToTable({
    groups: composition.groups.map(
      (t, groupIndex) =>
        ({
          slots: t.slots.map((s, index) =>
            s?.role === "Melee" && index === 0
              ? {
                  ...s,
                  name: `${s.name} [${raidTargets[groupIndex].name}]`,
                }
              : s,
          ),
        }) as Group,
    ),
  })}
\`\`\``;
}

export function getCthunAssignment(roster: Character[]): string {
  const assignments = makeAssignments(roster);

  return `
## Copy the following assignments to their specific use cases

### Discord Assignment for the specific raid channel:

${exportToDiscord(assignments)}

### WoW Raidsort Addon, do \`/raidsort import\` and copy the following value:
\`\`\`
${exportToLuaTable(assignments)}
\`\`\`
`;
}
