import { PlayerInfo } from "../../../integrations/sheets/player-info-table";
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
import { getCharactersOfPlayer, sortByShortEnd } from "../utils";

const MAX_NUMBER_OF_DECURSERS = 2;

export function makeAssignments(
  roster: Character[],
  players: PlayerInfo[],
): TargetAssignment[] {
  const damageDealerDecursers = roster.filter(
    (t) => CLASS_ROLE_MAP[t.class][t.role].canDecurse && t.role !== "Healer",
  );

  const decurseAssignments = sortByShortEnd(damageDealerDecursers, players)
    .reverse()
    .slice(0, MAX_NUMBER_OF_DECURSERS);

  return [
    {
      raidTarget: {
        icon: ALL_RAID_TARGETS.Skull,
        name: `Raid decurse assignments`,
      },
      assignments: [
        {
          id: "Raid decurse assignments",
          description: `Players who will be on decurse duty on Sapphiron`,
          characters: decurseAssignments,
        },
      ],
    },
  ];
}

export function exportToDiscord(
  sapphironAssignment: TargetAssignment[],
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

  return `${sapphironAssignment.map((t) => `- ${t.raidTarget.icon.discordEmoji} [${t.raidTarget.icon.name}] (${t.raidTarget.name}): ${t.assignments.map(printAssignment).join(" ")} `).join("\n")}`;
}

interface AssignmentInfo {
  [id: string]: {
    targetInfo: RaidTarget;
    assignees: Character[];
  }[];
}

export function exportToRaidWarning(
  sapphironAssignments: TargetAssignment[],
): string {
  const groupedByAssignmentTypeId = sapphironAssignments.reduce<AssignmentInfo>(
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

export async function getSapphironAssignment({
  characters,
  players,
}: RaidAssignmentRoster): Promise<RaidAssignmentResult> {
  const assignments = makeAssignments(characters, players);
  const dmAssignment = [
    `# Copy the following assignments to their specific use cases
## Discord Assignment for the specific raid channel:
### Sapphiron Decurse Assignments
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
The players should manage to decurse as many as they can.
${assignments[0].assignments[0].characters.map((x, idx) => ` ${idx + 1}. ${x.name}`).join("\n")}`;

  return Promise.resolve({
    dmAssignment,
    announcementTitle: "### Sapphiron Decurse Assignments",
    announcementAssignment,
    officerTitle: `### Sapphiron Decurse Assignments to post as a \`/rw\` in-game`,
    officerAssignment,
    shortEnders: assignments[0].assignments[0].characters,
    assignedCharacters: [
      ...new Set(
        assignments.flatMap((t) => t.assignments.flatMap((x) => x.characters)),
      ),
    ],
  });
}
