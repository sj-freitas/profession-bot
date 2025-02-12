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
import { shuffleArray } from "../utils";

const BOSS = {
  raidTarget: {
    icon: ALL_RAID_TARGETS.Cross,
    name: `Faerlina`,
  },
};
const LEFT_ADDS = {
  raidTarget: {
    icon: ALL_RAID_TARGETS.Skull,
    name: `Left Adds`,
  },
};
const RIGHT_ADDS = {
  raidTarget: {
    icon: ALL_RAID_TARGETS.Square,
    name: `Right Adds`,
  },
};

export function makeAssignments(roster: Character[]): TargetAssignment[] {
  const tanks = roster.filter((t) => t.role === "Tank");
  const shuffledTanks = shuffleArray(tanks);

  return [BOSS, LEFT_ADDS, RIGHT_ADDS].map((currTarget, idx) => ({
    ...currTarget,
    assignments: [
      {
        id: "Tanks",
        description: "tanked by",
        characters: [shuffledTanks[idx]],
      },
    ],
  }));
}

export function exportToDiscord(
  faerlinaAssignment: TargetAssignment[],
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

  return `${faerlinaAssignment.map((t) => `- ${t.raidTarget.icon.discordEmoji} [${t.raidTarget.icon.name}] (${t.raidTarget.name}): ${t.assignments.map(printAssignment).join(" ")} `).join("\n")}`;
}

interface AssignmentInfo {
  [id: string]: {
    targetInfo: RaidTarget;
    assignees: Character[];
  }[];
}

export function exportToRaidWarning(
  faerlinaAssignment: TargetAssignment[],
): string {
  const groupedByAssignmentTypeId = faerlinaAssignment.reduce<AssignmentInfo>(
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

export function getFaerlinaAssignment({
  characters,
  players,
}: RaidAssignmentRoster): Promise<RaidAssignmentResult> {
  const assignments = makeAssignments(characters);

  const dmAssignment = [
    `
# Copy the following assignments to their specific use cases
## Discord Assignment for the specific raid channel:
### Grand Widow Faerlina Tank Assignment
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
    announcementTitle: `### Grand Widow Faerlina Tank Assignment`,
    announcementAssignment,
    officerTitle: `### Grand Widow Faerlina assignments to post as a \`/rw\` in-game`,
    officerAssignment,
  });
}
