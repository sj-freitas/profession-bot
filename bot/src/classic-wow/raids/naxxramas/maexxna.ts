import { PlayerInfo } from "../../../integrations/sheets/player-info-table";
import {
  ALL_RAID_TARGETS,
  AssignmentDetails,
  Character,
  RaidTarget,
  TargetAssignment,
} from "../../raid-assignment";
import { RaidAssignmentResult } from "../assignment-config";
import { RaidAssignmentRoster } from "../raid-assignment-roster";
import { getCharactersOfPlayer, shuffleArray } from "../utils";

export function makeAssignments(roster: Character[]): TargetAssignment[] {
  // Melee Group assignment
  const druids = roster.filter(
    (t) => t.class === "Druid" && (t.role === "Ranged" || t.role === "Healer"),
  );

  const coolDownsOrder = shuffleArray([...druids]).slice(0, 2);

  return [
    {
      raidTarget: {
        icon: ALL_RAID_TARGETS.Skull,
        name: `Healing CD order on MT`,
      },
      assignments: [
        {
          id: "Healer Cooldown",
          description: `Order of druid Barkskin rotation${coolDownsOrder.length < 2 ? " - to be complemented with tank cooldowns." : "."}`,
          characters: coolDownsOrder,
        },
      ],
    },
  ];
}

export function exportToDiscord(
  maexxnaAssignment: TargetAssignment[],
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
        `/rw ${assignmentId}: ${details.map((t) => `${t.targetInfo.icon.symbol} ${t.targetInfo.name} = ${t.assignees.map((char, idx) => `${idx + 1} ${char.name}`).join(" > ")}`).join(" || ")}`,
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
\`\`\`

### As a list for people to see:
The characters are in order and should cycle through
${assignments[0].assignments[0].characters.map((x, idx) => ` ${idx + 1}. ${x.name}`).join("\n")}`;

  return Promise.resolve({
    dmAssignment,
    announcementTitle: "### Maexxna Healing Cooldown Assignment",
    announcementAssignment,
    officerTitle: `### Maexxna Healing Cooldown assignments to post as a \`/rw\` in-game`,
    officerAssignment,
  });
}
