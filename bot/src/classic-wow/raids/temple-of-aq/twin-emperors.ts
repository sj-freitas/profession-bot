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
import { getCharactersOfPlayer, sortByClasses } from "../utils";

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
  const healers = roster.filter((t) => t.role === "Healer");
  const sortedTanks = sortByClasses(tanks, ["Warrior", "Druid"]);
  const sortedHealers = sortByClasses(healers, ["Paladin", "Priest", "Druid"]);

  const [healerCaster, ...healersMelee] = sortedHealers;
  const [meleeTank, ...casterTanks] = sortedTanks;

  return [
    {
      ...CASTER_TWIN,
      assignments: [
        {
          id: "Tanks",
          description: "tanked by",
          characters: casterTanks,
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
          characters: [meleeTank],
        },
        {
          id: "Healer",
          description: "healed by",
          characters: healersMelee,
        },
      ],
    },
  ];
}

export function exportToDiscord(
  twinsAssignment: TargetAssignment[],
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
