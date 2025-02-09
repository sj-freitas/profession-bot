import { Player } from "../../../integrations/sheets/get-players";
import {
  ALL_RAID_TARGETS,
  AssignmentDetails,
  Character,
  RaidTarget,
  TargetAssignment,
} from "../../raid-assignment";
import { RaidAssignmentResult } from "../assignment-config";
import { RaidAssignmentRoster } from "../raid-assignment-roster";
import { pickOneAtRandomAndRemoveFromArray } from "../utils";
import { drawImageAssignments } from "./kel-thuzad-images";

export const NUMBER_OF_SIDES = 3;

// Make this configurable
const MELEE_LEADERS = [
  "Paynex",
  "Tearyn",
  "Nibsinobsi",
  "Snace",
  "Ashgiver",
  "Boomstronk",
];

export function makeAssignments(roster: Character[]): TargetAssignment[] {
  // Melee Group assignment
  const tanks = roster.filter((t) => t.role === "Tank");
  const meleeDps = roster.filter((t) => t.role === "Melee");
  const availableMeleeLeaders = meleeDps.filter((t) =>
    MELEE_LEADERS.find((x) => x === t.name),
  );

  // We might not have enough leaders, in this case promote 1 at random
  let takeIndex = 0;
  for (let i = availableMeleeLeaders.length; i < NUMBER_OF_SIDES; i += 1) {
    availableMeleeLeaders.push(meleeDps[takeIndex]);
    takeIndex += 1;
  }

  const pickedLeaders = new Array(NUMBER_OF_SIDES)
    .fill(null)
    .map(() => pickOneAtRandomAndRemoveFromArray(availableMeleeLeaders))
    .filter((t): t is Character => t !== null);
  const groups: Character[][] = pickedLeaders.map((t) => [t]);

  // Remove Leaders from melee DPS
  const pickedMeleeDps: Character[] = meleeDps.filter(
    (t) => !pickedLeaders.find((x) => x.name === t.name),
  );

  // Round robin set the a tank to each group
  const NUMBER_OF_TANKS = tanks.length;
  for (let i = 0; i < NUMBER_OF_TANKS; i += 1) {
    const currentTank = pickOneAtRandomAndRemoveFromArray(tanks);
    if (currentTank !== null) {
      groups[i % groups.length].push(currentTank);
    }
  }

  const NUMBER_OF_MELEE_DPS = pickedMeleeDps.length;
  for (let i = 0; i < NUMBER_OF_MELEE_DPS; i += 1) {
    const currentMeleeDps = pickOneAtRandomAndRemoveFromArray(pickedMeleeDps);
    if (currentMeleeDps !== null) {
      groups[i % groups.length].push(currentMeleeDps);
    }
  }

  const icons = [
    ALL_RAID_TARGETS.Star,
    ALL_RAID_TARGETS.Moon,
    ALL_RAID_TARGETS.Diamond,
  ];

  return icons.map((currIcon, groupIndex) => ({
    raidTarget: {
      icon: currIcon,
      name: `${groups[groupIndex][0].name}'s Group`,
    },
    assignments: [
      {
        id: "Stack",
        description:
          "Melee group stack - includes where tanks should position when NOT tanking",
        characters: groups[groupIndex],
      },
    ],
  }));
}

export function exportToDiscord(
  kelThuzadAssignment: TargetAssignment[],
  player: Player[],
): string {
  const characterDiscordHandleMap = new Map<string, string>();

  player.forEach((currPlayer) => {
    currPlayer.characters.forEach((currCharacter) => {
      characterDiscordHandleMap.set(currCharacter, currPlayer.discordId);
    });
  });

  const printAssignment = (currAssignment: AssignmentDetails) =>
    `${currAssignment.description} ${currAssignment.characters.map((t) => `<@${characterDiscordHandleMap.get(t.name)}>`).join(", ")}`;

  return `${kelThuzadAssignment.map((t) => `- ${t.raidTarget.icon.discordEmoji} [${t.raidTarget.icon.name}] (${t.raidTarget.name}): ${t.assignments.map(printAssignment).join(" ")} `).join("\n")}`;
}

interface AssignmentInfo {
  [id: string]: {
    targetInfo: RaidTarget;
    assignees: Character[];
  }[];
}

export function exportToRaidWarning(
  sarturaAssignment: TargetAssignment[],
): string {
  const groupedByAssignmentTypeId = sarturaAssignment.reduce<AssignmentInfo>(
    (res, curr) => {
      curr.assignments.forEach((t) => {
        res[t.id] = [
          ...(res[t.id] ?? []),
          {
            targetInfo: curr.raidTarget,
            assignees: t.characters,
          },
        ];
      });

      return res;
    },
    {},
  );

  return Object.entries(groupedByAssignmentTypeId)
    .map(
      ([assignmentId, details]) =>
        `/rw ${assignmentId}: ${details.map((t) => `${t.targetInfo.icon.symbol} ${t.targetInfo.name} = ${t.assignees.map((char) => char.name).join(", ")}`).join(" || ")}`,
    )
    .join("\n");
}

export async function getKelThuzadAssignment({
  characters,
  players,
}: RaidAssignmentRoster): Promise<RaidAssignmentResult> {
  const assignments = makeAssignments(characters);
  const meleeGroups = assignments.map((t) =>
    t.assignments[0].characters.map((x) => x.name),
  );
  const kelThuzadImageBuffer = await drawImageAssignments(meleeGroups);

  const dmAssignment = [
    `# Copy the following assignments to their specific use cases
## Discord Assignment for the specific raid channel:
### Kel'thuzad Melee Assignment
\`\`\`
${exportToDiscord(assignments, players)}
\`\`\`
## To be used as a raiding warning, copy these and use them in-game before the encounter:
\`\`\`
${exportToRaidWarning(assignments)}
\`\`\`
  `,
  ];

  const announcementAssignment = exportToDiscord(assignments, players);
  const officerAssignment = `\`\`\`
${exportToRaidWarning(assignments)}
\`\`\``;

  return Promise.resolve({
    dmAssignment,
    announcementTitle: "### Kel'Thuzad Melee Position Assignment",
    announcementAssignment,
    officerTitle: `### Kel'Thuzad assignments to post as a \`/rw\` in-game`,
    officerAssignment,
    files: [
      {
        attachment: kelThuzadImageBuffer,
        name: "kel-thuzad-melee-positions.png",
      },
    ],
  });
}
