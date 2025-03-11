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
import { getCharactersOfPlayer } from "../utils";

const YAUJ = {
  raidTarget: {
    icon: ALL_RAID_TARGETS.Skull,
    name: `Yauj`,
  },
};
const KRI = {
  raidTarget: {
    icon: ALL_RAID_TARGETS.Cross,
    name: `Kri`,
  },
};
const VEM = {
  raidTarget: {
    icon: ALL_RAID_TARGETS.Square,
    name: `Vem`,
  },
};

export function makeAssignments(roster: Character[]): TargetAssignment[] {
  const [mainTank, ...otherTanks] = roster.filter((t) => t.role === "Tank");

  const yaujAssigment = {
    ...YAUJ,
    assignments: [
      {
        id: "Tanks",
        description: "tanked by",
        characters: [mainTank],
      },
    ],
  };

  return [
    yaujAssigment,
    ...[KRI, VEM].map((currBug, idx) => ({
      ...currBug,
      assignments: [
        {
          id: "Tanks",
          description: "tanked by",
          characters: [otherTanks[idx % otherTanks.length]],
        },
      ],
    })),
  ];
}

export function exportToDiscord(
  bugTrioAssignment: TargetAssignment[],
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

  return `${bugTrioAssignment.map((t) => `- ${t.raidTarget.icon.discordEmoji} [${t.raidTarget.icon.name}] (${t.raidTarget.name}): ${t.assignments.map(printAssignment).join(" ")} `).join("\n")}`;
}

interface AssignmentInfo {
  [id: string]: {
    targetInfo: RaidTarget;
    assignees: Character[];
  }[];
}

export function exportToRaidWarning(
  bugTrioAssignment: TargetAssignment[],
): string {
  const groupedByAssignmentTypeId = bugTrioAssignment.reduce<AssignmentInfo>(
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

export function getBugTrioAssignment({
  characters,
  players,
}: RaidAssignmentRoster): Promise<RaidAssignmentResult> {
  const assignments = makeAssignments(characters);

  const dmAssignment = [
    `
# Copy the following assignments to their specific use cases
## Discord Assignment for the specific raid channel:
### Bug Trio Tank Assignment
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
    announcementTitle: `### Bug Trio Tank Assignment`,
    announcementAssignment,
    officerTitle: `### Bug Trio assignments to post as a \`/rw\` in-game`,
    officerAssignment,
  });
}
