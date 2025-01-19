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

const CASTER_TWIN = {
  raidTarget: {
    icon: ALL_RAID_TARGETS.Moon,
    name: `Left (Vek'lor on pull)`,
  },
};
const MELEE_TWIN = {
  raidTarget: {
    icon: ALL_RAID_TARGETS.Circle,
    name: `Right (Vek'nilash on pull)`,
  },
};

export function makeAssignments(roster: Character[]): TargetAssignment[] {
  const tanks = roster.filter((t) => t.role === "Tank");
  const [casterMainTank, casterOffTank, meleeMainTank] = shuffleArray(tanks);
  const [healerCaster, healerMelee] = [
    ...shuffleArray(
      roster.filter((t) => t.class === "Paladin" && t.role === "Healer"),
    ),
    ...shuffleArray(
      roster.filter(
        (t) =>
          !(t.class === "Paladin" || t.class === "Mage") && t.role === "Healer",
      ),
    ),
  ];

  return [
    {
      ...CASTER_TWIN,
      assignments: [
        {
          id: "Tanks",
          description: "tanked by",
          characters: [casterMainTank, casterOffTank],
        },
        {
          id: "Healer",
          description: "healed by",
          characters: [healerCaster],
        },
      ],
    },
    {
      ...MELEE_TWIN,
      assignments: [
        {
          id: "Tank",
          description: "tanked by",
          characters: [meleeMainTank],
        },
        {
          id: "Healer",
          description: "healed by",
          characters: [healerMelee],
        },
      ],
    },
  ];
}

export function exportToDiscord(
  twinsAssignment: TargetAssignment[],
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

  return `${twinsAssignment.map((t) => `- ${t.raidTarget.icon.discordEmoji} [${t.raidTarget.icon.name}] ${t.raidTarget.name}: ${t.assignments.map(printAssignment).join(" ")} `).join("\n")}`;
}

interface AssignmentInfo {
  [id: string]: {
    targetInfo: RaidTarget;
    assignees: Character[];
  }[];
}

export function exportToRaidWarning(
  twinsAssignment: TargetAssignment[],
): string {
  const groupedByAssignmentTypeId = twinsAssignment.reduce<AssignmentInfo>(
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

export function getTwinsAssignment({
  characters,
  players,
}: RaidAssignmentRoster): Promise<RaidAssignmentResult> {
  const assignments = makeAssignments(characters);

  const dmAssignment = [
    `
# Copy the following assignments to their specific use cases
## Discord Assignment for the specific raid channel:
### Twin Emperors Tank Assignment
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
    announcementTitle: `### Twin Emperors Tank Assignment`,
    announcementAssignment,
    officerTitle: `### Twins assignments to post as a \`/rw\` in-game`,
    officerAssignment,
  });
}
