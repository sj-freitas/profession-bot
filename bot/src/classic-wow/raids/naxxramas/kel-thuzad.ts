import { PlayerInfo } from "../../../integrations/sheets/player-info-table";
import { CLASS_ROLE_MAP } from "../../class-role";
import {
  ALL_RAID_TARGETS,
  AssignmentDetails,
  Character,
  TargetAssignment,
} from "../../raid-assignment";
import { RaidAssignmentResult } from "../assignment-config";
import { RaidAssignmentRoster } from "../raid-assignment-roster";
import { getCharactersOfPlayer, sortByClasses } from "../utils";
import { drawImageAssignments } from "./kel-thuzad-hm4-image";

export const NUMBER_OF_MELEE_SPOTS = 3;
export const NUMBER_OF_RANGED_SPOTS = 4;
export const NUMBER_OF_HEALING_SPOTS = 4;

function sortBySmallerSize<T>(array: T[][]): T[][] {
  return [...array].sort((t, v) => t.length - v.length);
}

function roundRobinAllocate<T>(groups: T[][], valuesToAllocate: T[]) {
  valuesToAllocate.forEach((curr: T, index: number) => {
    const currDestinationGroup = groups[index % groups.length];

    currDestinationGroup.push(curr);
  });
}

function createEmptyArrayOfArrays<T>(size: number): T[][] {
  return new Array(size).fill(null).map(() => []);
}

export function moveAllFeralsToGroup(
  groups: Character[][],
  indexOfDestination: number,
) {
  const groupToTransferTo = groups[indexOfDestination];
  if (!groupToTransferTo) {
    // Invalid group index.
    return;
  }

  const feralInfos = groups
    .map((x, idx) => ({
      feralsOfGroup: x.filter((t) => t.class === "Druid" && t.role === "Melee"),
      groupIndex: idx,
    }))
    .filter(({ groupIndex }) => groupIndex !== indexOfDestination)
    .map((t) => ({
      feralInfos: t.feralsOfGroup.map((x) => ({
        feral: x,
        groupIndex: t.groupIndex,
      })),
    }))
    .flatMap((t) => t.feralInfos);

  let currFeralIndex = 0;
  for (let i = 0; i < groupToTransferTo.length; i += 1) {
    const currMemberToMove = groupToTransferTo[i];
    const currFeralInfo = feralInfos[currFeralIndex];
    const canBeExchangedWithFeral = !(
      currMemberToMove.role === "Tank" ||
      (currMemberToMove.class === "Druid" && currMemberToMove.role === "Melee")
    );

    if (!currFeralInfo) {
      // No more ferals to handle
      return;
    }

    if (canBeExchangedWithFeral) {
      groupToTransferTo[i] = currFeralInfo.feral;

      const indexOfFeral = groups[currFeralInfo.groupIndex].findIndex(
        (t) => t.name === currFeralInfo.feral.name,
      );
      const groupOfFeral = groups[currFeralInfo.groupIndex];
      groupOfFeral[indexOfFeral] = currMemberToMove;

      currFeralIndex += 1;
    }
  }
}

export interface Interrupts {
  groupA: Character[];
  groupB: Character[];
  groupC: Character[];
}

function getInterrupters(characters: Character[]): Character[] {
  return characters.filter(
    (t) =>
      CLASS_ROLE_MAP[t.class][t.role].canInterrupt &&
      t.role !== "Tank" &&
      t.role !== "Healer" &&
      t.class !== "Paladin",
  );
}

export function makeAssignments(roster: Character[]): {
  mainTankAssignment: TargetAssignment;
  rangedAssignments: TargetAssignment[];
  meleeAssignments: TargetAssignment[];
  healerAssignments: Character[][];
  interrupts: Interrupts;
} {
  // Melee Group assignment
  const [mainTank, ...otherTanks] = sortByClasses(
    roster.filter((t) => t.role === "Tank"),
    ["Warrior", "Paladin", "Rogue", "Warlock", "Druid"],
  );
  const allTanks = [...otherTanks, mainTank];

  const meleeDps = sortByClasses(
    roster.filter((t) => t.role === "Melee"),
    ["Warrior", "Paladin", "Rogue", "Hunter"],
  );
  const rangedDps = sortByClasses(
    roster.filter((t) => t.role === "Ranged"),
    ["Priest", "Druid", "Mage", "Warlock"],
  );
  const healers = roster.filter((t) => t.role === "Healer");

  // Add an RNG element to the melee positioning
  const meleeGroups = createEmptyArrayOfArrays<Character>(
    NUMBER_OF_MELEE_SPOTS,
  );
  const rangedGroups = createEmptyArrayOfArrays<Character>(
    NUMBER_OF_RANGED_SPOTS,
  );
  const healerGroups = createEmptyArrayOfArrays<Character>(
    NUMBER_OF_HEALING_SPOTS,
  );

  roundRobinAllocate(meleeGroups, meleeDps);
  roundRobinAllocate(rangedGroups, rangedDps);
  roundRobinAllocate(healerGroups, healers);

  // Swap Group 2 with 3 on casters to make sure there's a spriest on Left and Right side.
  const [first, second, third, forth] = rangedGroups;
  const reOrderedRangedGroups = [first, third, second, forth];

  const sortedMeleeGroupsBySmallest = sortBySmallerSize(meleeGroups);
  roundRobinAllocate(sortedMeleeGroupsBySmallest, allTanks);
  // Something is off about the groups.
  moveAllFeralsToGroup(sortedMeleeGroupsBySmallest, 1);

  const rangedIcons = [
    ALL_RAID_TARGETS.Star,
    ALL_RAID_TARGETS.Circle,
    ALL_RAID_TARGETS.Diamond,
    ALL_RAID_TARGETS.Triangle,
  ];
  const meleeIcons = [
    ALL_RAID_TARGETS.Moon,
    ALL_RAID_TARGETS.Square,
    ALL_RAID_TARGETS.Cross,
  ];

  const rangedAssignments = rangedIcons.map((currIcon, groupIndex) => ({
    raidTarget: {
      icon: currIcon,
      name: `${reOrderedRangedGroups[groupIndex][0].name}'s Group`,
    },
    assignments: [
      {
        id: "Stack",
        description:
          "Ranged group stack - spread until the circle is tight then you stack",
        characters: reOrderedRangedGroups[groupIndex],
      },
    ],
  }));
  const meleeAssignments = meleeIcons.map((currIcon, groupIndex) => ({
    raidTarget: {
      icon: currIcon,
      name: `${sortedMeleeGroupsBySmallest[groupIndex][0].name}'s Group`,
    },
    assignments: [
      {
        id: "Stack",
        description:
          "Melee group stack - includes where tanks should position when NOT tanking",
        characters: sortedMeleeGroupsBySmallest[groupIndex],
      },
    ],
  }));
  const mainTankAssignment = {
    raidTarget: {
      icon: ALL_RAID_TARGETS.Skull,
      name: `Main Tank`,
    },
    assignments: [
      {
        id: "Main Tank",
        description: "Main tank on the boss",
        characters: [mainTank],
      },
    ],
  };

  return {
    mainTankAssignment,
    rangedAssignments,
    meleeAssignments,
    healerAssignments: healerGroups,
    interrupts: {
      groupA: getInterrupters(meleeAssignments[0].assignments[0].characters),
      groupB: getInterrupters(meleeAssignments[1].assignments[0].characters),
      groupC: getInterrupters(meleeAssignments[2].assignments[0].characters),
    },
  };
}

export function exportToDiscord(
  kelThuzadAssignment: TargetAssignment[],
  interrupters: Interrupts,
  player: PlayerInfo[],
): string {
  const characterDiscordHandleMap = new Map<string, string>();

  player.forEach((currPlayer) => {
    getCharactersOfPlayer(currPlayer).forEach((currCharacter) => {
      characterDiscordHandleMap.set(currCharacter, currPlayer.discordId);
    });
  });

  const printAssignment = (currAssignment: AssignmentDetails) =>
    `${currAssignment.description} ${currAssignment.characters.map((t) => `<@${characterDiscordHandleMap.get(t.name)}>`).join(", ")}`;

  return `${kelThuzadAssignment.map((t) => `- ${t.raidTarget.icon.discordEmoji} [${t.raidTarget.icon.name}] (${t.raidTarget.name}): ${t.assignments.map(printAssignment).join(" ")} `).join("\n")}

### Interrupts on Kel'Thuzad
- Group A: ${interrupters.groupA.map((t, index) => `${index + 1}. <@${characterDiscordHandleMap.get(t.name)}>`).join("\n")}
- Group B: ${interrupters.groupB.map((t, index) => `${index + 1}. <@${characterDiscordHandleMap.get(t.name)}>`).join("\n")}
- Group C: ${interrupters.groupC.map((t, index) => `${index + 1}. <@${characterDiscordHandleMap.get(t.name)}>`).join("\n")}`;
}

export function exportToRaidWarning(interrupts: Interrupts): string {
  return `/rw Interrupts on Kel'Thuzad: A: ${interrupts.groupA.map((x) => x.name).join(",")} B: ${interrupts.groupB.map((x) => x.name).join(",")} C: ${interrupts.groupC.map((x) => x.name).join(",")}`;
}

export async function getKelThuzadAssignment({
  characters,
  players,
}: RaidAssignmentRoster): Promise<RaidAssignmentResult> {
  const assignments = makeAssignments(characters);
  const allDpsAssignments = [
    ...assignments.meleeAssignments,
    ...assignments.rangedAssignments,
  ];

  const mainTankAssignment =
    assignments.mainTankAssignment.assignments[0].characters.map((x) => x.name);
  const meleeGroups = assignments.meleeAssignments.map((t) =>
    t.assignments[0].characters.map((x) =>
      x.name === mainTankAssignment[0] ? `${x.name}*` : x.name,
    ),
  );
  const rangedGroups = assignments.rangedAssignments.map((t) =>
    t.assignments[0].characters.map((x) => x.name),
  );
  const healerGroups = assignments.healerAssignments.map((t) =>
    t.map((x) => x.name),
  );
  const kelThuzadImageBuffer = await drawImageAssignments(
    mainTankAssignment,
    meleeGroups,
    rangedGroups,
    healerGroups,
  );

  const dmAssignment = [
    `# Copy the following assignments to their specific use cases
## Discord Assignment for the specific raid channel:
### Kel'thuzad Assignment
\`\`\`
${exportToDiscord(allDpsAssignments, assignments.interrupts, players)}
\`\`\``,
    `
## To be used as a raiding warning, copy these and use them in-game before the encounter:
\`\`\`
${exportToRaidWarning(assignments.interrupts)}
\`\`\`
  `,
  ];

  const announcementAssignment = exportToDiscord(
    allDpsAssignments,
    assignments.interrupts,
    players,
  );
  const officerAssignment = `\`\`\`
${exportToRaidWarning(assignments.interrupts)}
\`\`\``;

  return Promise.resolve({
    dmAssignment,
    announcementTitle: "### Kel'Thuzad Position Assignment",
    announcementAssignment,
    officerTitle: `### Kel'Thuzad assignments to post as a \`/rw\` in-game`,
    officerAssignment,
    files: [
      {
        attachment: kelThuzadImageBuffer,
        name: "kel-thuzad-positions.png",
      },
    ],
  });
}
