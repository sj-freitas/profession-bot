import { CLASS_ROLE_MAP, isMeleeCharacter } from "../../class-role";
import {
  ALL_RAID_TARGETS,
  Character,
  Group,
  Raid,
} from "../../raid-assignment";
import { RaidAssignmentResult } from "../assignment-config";
import { RaidAssignmentRoster } from "../raid-assignment-roster";
import {
  exportRaidGroupsToTable,
  exportToLuaTable,
  pickOneAtRandomAndRemoveFromArray,
} from "../utils";
import { drawImageAssignments } from "./cthun-images";

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
    Math.ceil(
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

  return `Check your positioning on the map below, the map is dynamically generated and it **might change to optimize with the current setup.**
Each melee has a "group leader" stack on top of your group's leader.

\`\`\`
${exportRaidGroupsToTable({
  groups: composition.groups.map(
    (t, groupIndex) =>
      ({
        slots: t.slots.map((s, index) =>
          (s?.role === "Melee" ||
            (s?.role === "Tank" && s.class !== "Warlock")) &&
          index === 0
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

function getLeaderOfEachGroup(composition: Raid): string[] {
  return composition.groups.map((t) =>
    t.slots
      .filter((s): s is Character => Boolean(s))
      .filter(
        (s) =>
          s.role === "Melee" || (s.role === "Tank" && s.class !== "Warlock"),
      )
      .map((s) => s.name)
      .join("\n"),
  );
}

export async function getCthunAssignment(
  roster: RaidAssignmentRoster,
): Promise<RaidAssignmentResult> {
  const assignments = makeAssignments(roster.characters);
  const cthunImageBuffer = await drawImageAssignments(
    getLeaderOfEachGroup(assignments),
  );
  const dmAssignment = [
    `# Copy the following assignments to their specific use cases
## Discord Assignment for the specific raid channel:
### C'thun composition
${exportToDiscord(assignments)}`,
    `## WoW Raidsort Addon, do \`/raidsort import cthun\` and copy the following value:
\`\`\`
${exportToLuaTable(assignments)}
\`\`\`
### The following image contains assignments for all groups:
`,
  ];

  const announcementAssignment = `${exportToDiscord(assignments)}
**The following image contains assignments for all groups:**
`;
  const officerAssignment = `Do \`/raidsort import cthun\` in-game to open the AddOn and copy the following value:
\`\`\`
${exportToLuaTable(assignments)}
\`\`\`
Once the setup is loaded you can \`/raidsort load cthun\` to sort groups or \`/raidsort invite cthun\` to invite members into the raid.
`;

  return {
    dmAssignment,
    announcementTitle: `### C'thun composition`,
    announcementAssignment,
    officerTitle: `### C'thun composition for Raidsort AddOn`,
    officerAssignment,
    files: [{ attachment: cthunImageBuffer, name: "cthun-positions.png" }],
  };
}
