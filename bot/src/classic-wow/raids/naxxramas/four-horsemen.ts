import { PlayerInfo } from "../../../integrations/sheets/player-info-table";
import { filterTwo } from "../../../lib/array-utils";
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
import { drawImageAssignments } from "./four-horsemen-images";

const THANE_KORTHAZZ = {
  raidTarget: {
    icon: ALL_RAID_TARGETS.Skull,
    name: `Thane Korth'azz`,
  },
};
const HIGHLORD_MOGRAINE = {
  raidTarget: {
    icon: ALL_RAID_TARGETS.Cross,
    name: `Highlord Mograine`,
  },
};
const SIR_ZELIEK = {
  raidTarget: {
    icon: ALL_RAID_TARGETS.Square,
    name: `Sir Zeliek`,
  },
};
const LADY_BLAUMEUX = {
  raidTarget: {
    icon: ALL_RAID_TARGETS.Triangle,
    name: `Lady Blaumeux`,
  },
};

export function makeAssignments(roster: Character[]): TargetAssignment[] {
  const allTanks = sortByClasses(
    roster.filter((t) => t.role === "Tank"),
    ["Warrior", "Druid", "Paladin", "Rogue", "Warlock"],
  );
  const [firstTank, secondTank, ...restOfTanks] = allTanks;
  const frontTanks = [firstTank, secondTank];
  const allAvailableBackTanks = [
    ...restOfTanks,
    ...roster.filter((t) => t.class === "Priest" && t.role === "Ranged"),
  ];
  const [backTankOne, backTankTwo] = [
    ...sortByClasses(allAvailableBackTanks, ["Warlock", "Priest"]),
    ...roster.filter((t) => t.class === "Warlock" && t.role === "Ranged"),
    ...roster.filter((t) => t.class === "Druid" && t.role === "Ranged"),
    ...roster.filter((t) => t.class === "Mage" && t.role === "Ranged"),
  ];
  const backTanks = [backTankOne, backTankTwo];
  const healers = roster.filter((t) => t.role === "Healer");
  const [backHealers, otherHealers] = filterTwo(
    healers,
    (t) => t.role === "Healer" && t.class === "Paladin",
  );
  const [backHealer, ...frontHealers] = [...backHealers, ...otherHealers];
  const [rangedHealer, ...meleeHealers] = sortByClasses(frontHealers, [
    "Druid",
    "Mage",
    "Priest",
  ]);

  return [
    {
      ...THANE_KORTHAZZ,
      assignments: [
        {
          id: `${THANE_KORTHAZZ.raidTarget.name} tanking`,
          description: `Initial tanking and healing. Position is initially East`,
          characters: [frontTanks[0], ...meleeHealers],
        },
      ],
    },
    {
      ...HIGHLORD_MOGRAINE,
      assignments: [
        {
          id: `${HIGHLORD_MOGRAINE.raidTarget.name} tanking`,
          description: `Initial tanking and healing. Position is initially North`,
          characters: [frontTanks[1], rangedHealer],
        },
      ],
    },
    {
      ...LADY_BLAUMEUX,
      assignments: [
        {
          id: `${LADY_BLAUMEUX.raidTarget.name} tanking`,
          description: `Initial tanking and healing. Position is always South`,
          characters: [backTanks[0], backHealer],
        },
      ],
    },
    {
      ...SIR_ZELIEK,
      assignments: [
        {
          id: `${SIR_ZELIEK.raidTarget.name} tanking`,
          description: `Initial tanking and healing. Position is always West`,
          characters: [backTanks[1], backHealer],
        },
      ],
    },
  ];
}

export function exportToDiscord(
  fourHorsemenAssignment: TargetAssignment[],
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

  return `${fourHorsemenAssignment.map((t) => `- ${t.raidTarget.icon.discordEmoji} [${t.raidTarget.icon.name}] (${t.raidTarget.name}): ${t.assignments.map(printAssignment).join(" ")} `).join("\n")}`;
}

interface AssignmentInfo {
  [id: string]: {
    targetInfo: RaidTarget;
    assignees: Character[];
  }[];
}

export function exportToRaidWarning(
  fourHorsemenAssignment: TargetAssignment[],
): string {
  const groupedByAssignmentTypeId =
    fourHorsemenAssignment.reduce<AssignmentInfo>((res, curr) => {
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
    }, {});

  return Object.entries(groupedByAssignmentTypeId)
    .map(
      ([assignmentId, details]) =>
        `/rw ${assignmentId}: ${details.map((t) => `${t.targetInfo.icon.symbol} ${t.targetInfo.name} = ${t.assignees.map((char) => char.name).join(", ")}`).join(" || ")}`,
    )
    .join("\n");
}

export async function getFourHorsemenAssignmentAssignment({
  characters,
  players,
}: RaidAssignmentRoster): Promise<RaidAssignmentResult> {
  const assignments = makeAssignments(characters);

  const dmAssignment = [
    `
# Copy the following assignments to their specific use cases
## Discord Assignment for the specific raid channel:
### Four Horsemen Assignment Tank Assignment
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

  const fourHorsemenImageBuffer = await drawImageAssignments(
    assignments.map((t) => {
      const [tank, ...healers] = t.assignments[0].characters.map((x) => x.name);
      return {
        tank,
        healers,
      };
    }),
  );

  return Promise.resolve({
    dmAssignment,
    announcementTitle: `### Four Horsemen Tank Assignment`,
    announcementAssignment,
    officerTitle: `### Four Horsemen assignments to post as a \`/rw\` in-game`,
    files: [
      {
        attachment: fourHorsemenImageBuffer,
        name: "four-horsemen-assignments.png",
      },
    ],
    officerAssignment,
    assignedCharacters: [
      ...new Set(
        assignments.flatMap((t) => t.assignments.flatMap((x) => x.characters)),
      ),
    ],
  });
}
