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
import { getCharactersOfPlayer, sortByShortEnd } from "../utils";

const MAX_KITERS = 2;

export function makeAssignments(
  roster: Character[],
  players: PlayerInfo[],
): TargetAssignment[] {
  // Get Ranged Hunters first
  // Fill in empty spots with warlocks and melee hunters
  const sortedCharacters = sortByShortEnd(roster, players).reverse();
  const tanks = sortedCharacters.filter((t) => t.role === "Tank");
  const rangedHunters = sortedCharacters.filter(
    (t) => t.role === "Ranged" && t.class === "Hunter",
  );
  const availableTankKiters =
    tanks.length > 1 ? tanks.filter((t) => t.class === "Warlock") : [];
  const meleeHunters = sortedCharacters.filter(
    (t) => t.role === "Melee" && t.class === "Hunter",
  );

  const selectedKiters = [
    ...rangedHunters,
    ...availableTankKiters,
    ...meleeHunters,
  ].slice(0, MAX_KITERS);

  return [
    {
      raidTarget: {
        icon: ALL_RAID_TARGETS.Diamond,
        name: `Kiting assignments`,
      },
      assignments: [
        {
          id: "Kiter assignments",
          description: `Players who will be on kiting the zombies on Gluth`,
          characters: selectedKiters,
        },
      ],
    },
  ];
}

export function exportToDiscord(
  gluthAssignment: TargetAssignment[],
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

  return `${gluthAssignment.map((t) => `- ${t.raidTarget.icon.discordEmoji} [${t.raidTarget.icon.name}] (${t.raidTarget.name}): ${t.assignments.map(printAssignment).join(" ")} `).join("\n")}`;
}

interface AssignmentInfo {
  [id: string]: {
    targetInfo: RaidTarget;
    assignees: Character[];
  }[];
}

export function exportToRaidWarning(
  gluthAssignments: TargetAssignment[],
): string {
  const groupedByAssignmentTypeId = gluthAssignments.reduce<AssignmentInfo>(
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

export async function getGluthAssignment({
  characters,
  players,
}: RaidAssignmentRoster): Promise<RaidAssignmentResult> {
  const assignments = makeAssignments(characters, players);
  const dmAssignment = [
    `# Copy the following assignments to their specific use cases
## Discord Assignment for the specific raid channel:
### Gluth Kiter Assignments
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
    announcementTitle: "### Gluth Kiter Assignments",
    announcementAssignment,
    officerTitle: `### Gluth Kiter Assignments to post as a \`/rw\` in-game`,
    officerAssignment,
    shortEnders: assignments[0].assignments[0].characters,
    assignedCharacters: [
      ...new Set(
        assignments.flatMap((t) => t.assignments.flatMap((x) => x.characters)),
      ),
    ],
  });
}
