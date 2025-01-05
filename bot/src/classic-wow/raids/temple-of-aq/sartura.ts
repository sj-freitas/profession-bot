import { Player } from "../../../integrations/sheets/get-players";
import { CLASS_ROLE_MAP } from "../../class-role";
import {
  ALL_RAID_TARGETS,
  AssignmentDetails,
  Character,
  RaidTarget,
  TargetAssignment,
} from "../../raid-assignment";
import { RaidAssignmentResult } from "../assignment-config";
import { RaidAssignmentRoster } from "../raid-assignment-roster";
import { pickOnePutOnTop } from "../utilts";

const NUMBER_OF_ADDS = 3;

export function makeAssignments(
  roster: Character[],
  mainTankBias?: string,
): TargetAssignment[] {
  const biasedMainTank = (roster.filter((t) => t.name === mainTankBias) ??
    [])[0];
  const tanks = roster.filter((t) => t.role === "Tank");
  const [mainTank, ...restOfTheTanks] = pickOnePutOnTop(tanks, biasedMainTank);

  const stunners = roster
    .filter((t) => t.role === "Melee")
    .filter((t) => CLASS_ROLE_MAP[t.class][t.role].canStun);

  const numberOfStunnersPerTarget = Math.floor(
    stunners.length / NUMBER_OF_ADDS,
  );

  // Reduce each group of stunners into
  const allTargetsInOrder = Object.values(ALL_RAID_TARGETS);
  const targets = allTargetsInOrder.slice(0, NUMBER_OF_ADDS);
  const addAssignments: TargetAssignment[] = targets.map(
    (currTarget, index) => {
      const isLastIndex = Boolean(index === targets.length - 1);
      const assignedStunners = stunners.slice(
        index * numberOfStunnersPerTarget,
        isLastIndex
          ? undefined
          : index * numberOfStunnersPerTarget + numberOfStunnersPerTarget,
      );
      // This prevents the skull tank from being picked onto another target, this makes it
      // less pressure to be on the nuke target.
      const assignedTank =
        restOfTheTanks[index === 0 ? 0 : index % restOfTheTanks.length || 1];

      return {
        raidTarget: {
          icon: currTarget,
          name: `Add ${index + 1}`,
        },
        assignments: [
          {
            id: "Tanks",
            description: "tanked by",
            characters: [assignedTank],
          },
          {
            id: "Stunners",
            description: "stunned by",
            characters: assignedStunners,
          },
        ],
      };
    },
  );

  return [
    {
      raidTarget: {
        icon: allTargetsInOrder[NUMBER_OF_ADDS],
        name: "Sartura",
      },
      assignments: [
        {
          id: "Tanks",
          description: "tanked by",
          characters: [mainTank],
        },
      ],
    },
    ...addAssignments,
  ];
  // Make sure we have a main tank on the boss
}

export function exportToDiscord(
  sarturaAssignment: TargetAssignment[],
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

  return `### Sartura Stun and Tank Assignment
${sarturaAssignment.map((t) => `- ${t.raidTarget.icon.discordEmoji} [${t.raidTarget.icon.name}] (${t.raidTarget.name}): ${t.assignments.map(printAssignment).join(" ")} `).join("\n")}`;
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

export function getSarturaAssignment({
  characters,
  players,
}: RaidAssignmentRoster): RaidAssignmentResult {
  const assignments = makeAssignments(characters);

  const dmAssignment = `
# Copy the following assignments to their specific use cases

## Discord Assignment for the specific raid channel:
\`\`\`
${exportToDiscord(assignments, players)}
\`\`\`

## To be used as a raiding warning, copy these and use them in-game before the encounter:
\`\`\`
${exportToRaidWarning(assignments)}
\`\`\`
  `;

  const announcementAssignment = exportToDiscord(assignments, players);
  const officerAssignment = `### Sartura assignments to post as a \`/rw\` in-game
\`\`\`
${exportToRaidWarning(assignments)}
\`\`\``;

  return {
    dmAssignment,
    announcementAssignment,
    officerAssignment,
  };
}
