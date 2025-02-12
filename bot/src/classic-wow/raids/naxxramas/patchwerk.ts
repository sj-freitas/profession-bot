import { Player } from "../../../integrations/sheets/get-players";
import { filterTwo } from "../../../lib/array-utilts";
import {
  ALL_RAID_TARGETS,
  AssignmentDetails,
  Character,
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
  const priests = roster.filter(
    (t) => t.class === "Priest" && t.role === "Healer",
  );
  const defensiveCooldownOrder = [...druids, ...priests];
  // Split these per tank
  const healersInOrder = assignedHealers.map((t) =>
    t.class === "Priest" || t.class === "Druid" ? t : null,
  );
  const allTanks = [actualMainTank, ...allHatefulStrikeTanks];
  const defensiveCooldownGroups: Character[][] = allTanks.map((_, index) =>
    [healersInOrder[index] ?? null].filter((t) => t !== null),
  );
  defensiveCooldownOrder.forEach((currCharacter, index) => {
    const tankIndex = index % allTanks.length;

    if (
      !defensiveCooldownGroups[tankIndex].find(
        (t) => currCharacter.name === t.name,
      )
    ) {
      defensiveCooldownGroups[tankIndex].push(currCharacter);
    }
  });

  const raidTargets = Object.values(ALL_RAID_TARGETS).reverse();
  return [
    {
      raidTarget: {
        icon: raidTargets[0],
        name: `Main Tank`,
      },
      assignments: [
        {
          id: `MT`,
          description: "Main Tank",
          characters: [actualMainTank],
        },
        {
          id: `Healed by`,
          description: "healed by",
          characters: [mainTankHealer],
        },
        {
          id: `Defensive cooldown rotation (last 30%) Suppression / Barkskin for ${actualMainTank.name} by`,
          description: `defensive cooldowns by`,
          characters: defensiveCooldownGroups[0] ?? [],
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
          description: "Hateful Strike Tank",
          characters: [currTank],
        },
        {
          id: `Healed by`,
          description: `healed by`,
          characters: [singleTargetHealers[index]],
        },
        {
          id: `Defensive cooldown rotation (last 30%) Suppression / Barkskin for ${currTank.name} by`,
          description: `defensive cooldowns by`,
          characters: defensiveCooldownGroups[BASE_INDEX + index] ?? [],
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

  return `${patchwerkAssignment
    .map(
      (t) =>
        `- ${t.raidTarget.icon.discordEmoji} [${t.raidTarget.icon.name}] (${t.raidTarget.name}): ${t.assignments.map(printAssignment).join(" ")} `,
    )
    .join("\n")}
Unassigned Healers just heal whatever they can.`;
}

export function exportToRaidWarning(
  patchwerkAssignments: TargetAssignment[],
): string {
  return patchwerkAssignments
    .map((currAssignment) => {
      const [tanks, healers, cooldowns] = currAssignment.assignments;
      const tankedBy = `${tanks.characters.map((x) => x.name).join(" || ")}`;
      const healedBy = `${healers.description} ${healers.characters.map((x) => x.name).join(" || ")}`;
      const defensiveCooldowns = `${cooldowns.description} ${cooldowns.characters.map((x) => x.name).join(" > ")}`;

      return `/rw ${currAssignment.raidTarget.name}: ${tankedBy} ${healedBy} ${defensiveCooldowns}`;
    })
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
