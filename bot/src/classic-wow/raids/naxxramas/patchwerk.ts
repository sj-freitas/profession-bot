import { Player } from "../../../integrations/sheets/get-players";
import { filterTwo } from "../../../lib/array-utilts";
import {
  ALL_RAID_TARGETS,
  AssignmentDetails,
  Character,
  RaidTarget,
  TargetAssignment,
} from "../../raid-assignment";
import { RaidAssignmentResult } from "../assignment-config";
import { RaidAssignmentRoster } from "../raid-assignment-roster";
import { pickOneAtRandomAndRemoveFromArray } from "../utils";

export function makeAssignments(roster: Character[]): TargetAssignment[] {
  // Melee Group assignment
  const tanks = roster.filter((t) => t.role === "Tank");
  const [mainTanks, hatefulStrikeTanks] = filterTwo(
    tanks,
    (t) => t.class !== "Druid" && t.class !== "Warlock",
  );

  const [mainTank, ...rest] = mainTanks;
  const allHatefulStrikeTanks = [...rest, ...hatefulStrikeTanks];
  const actualMainTank =
    mainTank ?? pickOneAtRandomAndRemoveFromArray(allHatefulStrikeTanks);

  const healers = roster.filter((t) => t.role === "Healer");
  const [singleTargetHealers, restOfHealers] = filterTwo(
    healers,
    (t) => t.class === "Priest" || t.class === "Paladin",
  );
  const [mainTankHealer] = restOfHealers;
  const BASE_INDEX = 1;

  const assignedHealers = [mainTankHealer, ...singleTargetHealers];
  const druids = roster.filter(
    (t) =>
      t.class === "Druid" &&
      (t.role === "Ranged" || t.role === "Healer") &&
      !assignedHealers.find((x) => x.name === t.name),
  );
  const priests = roster.filter((t) => t.class === "Priest");
  const defensiveCooldownOrder = [...druids, ...priests];
  // Split these per tank
  const healersInOrder = assignedHealers.map((t) =>
    t.class === "Priest" || t.class === "Druid" ? t : null,
  );
  const defensiveCooldownGroups: Character[][] = [
    actualMainTank,
    ...hatefulStrikeTanks,
  ].map((_, index) =>
    [healersInOrder[index] ?? null].filter((t) => t !== null),
  );
  defensiveCooldownOrder.forEach((currCharacter, index) => {
    const tankIndex = index % defensiveCooldownGroups.length;
    defensiveCooldownGroups[tankIndex].push(currCharacter);
  });

  const raidTargets = Object.values(ALL_RAID_TARGETS).reverse();
  return [
    {
      raidTarget: {
        icon: raidTargets[0],
        name: `Healing on MT`,
      },
      assignments: [
        {
          id: "The Main Tank",
          description: "The player who will be on top of the threat",
          characters: [actualMainTank],
        },
        {
          id: "MT Healer",
          description: "Healer that focuses on the main-tank",
          characters: [mainTankHealer],
        },
        {
          id: `Defensive cooldown rotation on the MT during enrage (last 30%)`,
          description: `Pain Suppression / Barkskin usage on enrage for ${actualMainTank.name}`,
          characters: defensiveCooldownGroups[0],
        },
      ],
    },
    ...allHatefulStrikeTanks.map((currTank, index) => ({
      raidTarget: {
        icon: raidTargets[BASE_INDEX + index],
        name: `Hateful Strike Tank ${index + 1}`,
      },
      assignments: [
        {
          id: `Hateful Strike Tank ${index + 1}`,
          description:
            "A tank who will be on taking the most damage and should always be topped-off",
          characters: [currTank],
        },
        {
          id: `Healer on ${currTank.name}`,
          description: `Healer that spam heals ${currTank.name}`,
          characters: [singleTargetHealers[index]],
        },
        {
          id: `Defensive cooldown rotation on ${currTank.name} during enrage (last 30%)`,
          description: `Pain Suppression / Barkskin usage on enrage for ${currTank.name}`,
          characters: defensiveCooldownGroups[BASE_INDEX + index],
        },
      ],
    })),
  ];
}

export function exportToDiscord(
  patchwerkAssignment: TargetAssignment[],
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

  return `${patchwerkAssignment.map((t) => `- ${t.raidTarget.icon.discordEmoji} [${t.raidTarget.icon.name}] (${t.raidTarget.name}): ${t.assignments.map(printAssignment).join(" ")} `).join("\n")}
Unassigned Healers just heal whatever they can.`;
}

interface AssignmentInfo {
  [id: string]: {
    targetInfo: RaidTarget;
    assignees: Character[];
  }[];
}

export function exportToRaidWarning(
  patchwerkAssignments: TargetAssignment[],
): string {
  const groupedByAssignmentTypeId = patchwerkAssignments.reduce<AssignmentInfo>(
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

export async function getPatchwerkAssignment({
  characters,
  players,
}: RaidAssignmentRoster): Promise<RaidAssignmentResult> {
  const assignments = makeAssignments(characters);
  const dmAssignment = [
    `# Copy the following assignments to their specific use cases
## Discord Assignment for the specific raid channel:
### Patchwerk Assignments
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
    announcementTitle: "### Patchwork Assignments",
    announcementAssignment,
    officerTitle: `### Patchwork assignments to post as a \`/rw\` in-game`,
    officerAssignment,
  });
}
