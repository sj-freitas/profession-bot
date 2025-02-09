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

export function makeAssignments(roster: Character[]): TargetAssignment[] {
  // Melee Group assignment
  const druids = roster.filter(
    (t) => t.class === "Druid" && (t.role === "Ranged" || t.role === "Healer"),
  );
  const priests = roster.filter((t) => t.class === "Priest" && t.role === "Healer");

  const coolDownsOrder = [...druids, ...priests];

  return [
    {
      raidTarget: {
        icon: ALL_RAID_TARGETS.Skull,
        name: `Healing CD order on MT`,
      },
      assignments: [
        {
          id: "Healer Cooldown",
          description:
            "Order of healer cooldowns, Pain Suppression and Barkskin.",
          characters: coolDownsOrder,
        },
      ],
    },
  ];
}

export function exportToDiscord(
  maexxnaAssignment: TargetAssignment[],
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

  return `${maexxnaAssignment.map((t) => `- ${t.raidTarget.icon.discordEmoji} [${t.raidTarget.icon.name}] (${t.raidTarget.name}): ${t.assignments.map(printAssignment).join(" ")} `).join("\n")}`;
}

interface AssignmentInfo {
  [id: string]: {
    targetInfo: RaidTarget;
    assignees: Character[];
  }[];
}

export function exportToRaidWarning(
  maexxnaAssignments: TargetAssignment[],
): string {
  const groupedByAssignmentTypeId = maexxnaAssignments.reduce<AssignmentInfo>(
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

export async function getMaexxnaAssignment({
  characters,
  players,
}: RaidAssignmentRoster): Promise<RaidAssignmentResult> {
  const assignments = makeAssignments(characters);
  const dmAssignment = [
    `# Copy the following assignments to their specific use cases
## Discord Assignment for the specific raid channel:
### Maexxna Assignments
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
    announcementTitle: "### Maexxna Healing Cooldown Assignment",
    announcementAssignment,
    officerTitle: `### Maexxna Healing Cooldown assignments to post as a \`/rw\` in-game`,
    officerAssignment,
  });
}
