import { PlayerInfo } from "../../../integrations/sheets/player-info-table";
import { Predicate } from "../../../lib/array-utils";
import {
  ALL_RAID_TARGETS,
  AssignmentDetails,
  Character,
  TargetAssignment,
} from "../../raid-assignment";
import { RaidAssignmentResult } from "../assignment-config";
import { RaidAssignmentRoster } from "../raid-assignment-roster";
import { getCharactersOfPlayer, sortByClasses } from "../utils";

const FIGHT_DURATION_ESTIMATION = 60;
const NUMBER_OF_HATEFUL_STRIKE_TANKS = 1;

function calculateWhenToApplyCooldowns(
  cooldowns: Character[],
  totalFightDurationInSeconds: number,
): number {
  const classCooldownDurationMap: { [key: string]: number } = {
    Druid: 15,
    Priest: 8,
    Warrior: 15,
  };

  const timeSum = cooldowns
    .map((t) => classCooldownDurationMap[t.class] ?? 0)
    .reduce((res, next) => res + next, 0);

  const lastDuration = totalFightDurationInSeconds - timeSum;
  const percentage = Math.floor(
    (lastDuration / totalFightDurationInSeconds) * 100,
  );

  return 100 - percentage;
}

export function makeAssignments(roster: Character[]): TargetAssignment[] {
  const tanks = roster.filter((t) => t.role === "Tank");
  const sortedTanks = sortByClasses(tanks, [
    "Warlock",
    "Shaman",
    "Warrior",
    "Druid",
    "Rogue",
  ]);

  const [mainTank, ...otherTanks] = sortedTanks;
  const hatefulStrikeTanks = [...otherTanks].slice(
    0,
    NUMBER_OF_HATEFUL_STRIKE_TANKS,
  );

  const healers = roster.filter((t) => t.role === "Healer");
  const sortedHealers = sortByClasses(healers, ["Paladin", "Priest", "Druid"]);

  // Split sorted tanks by number of hateful strike tanks.
  const NUMBER_OF_HEALERS_PER_TANK = Math.floor(
    healers.length / (hatefulStrikeTanks.length + 1),
  );
  const tankAssignments = [...hatefulStrikeTanks, mainTank].map((x, index) => ({
    tank: x,
    healers: sortedHealers.slice(
      index * NUMBER_OF_HEALERS_PER_TANK,
      index * NUMBER_OF_HEALERS_PER_TANK + NUMBER_OF_HEALERS_PER_TANK,
    ),
    isMainTank: x.name === mainTank.name,
  }));

  // Get the list of who has the defensive cooldowns. Assign them all to the hateful strike tanks.
  const hasBarkskin: Predicate<Character> = (t: Character) =>
    t.class === "Druid" && (t.role === "Ranged" || t.role === "Healer");
  const hasPainSuppression: Predicate<Character> = (t: Character) =>
    t.class === "Priest" && t.role === "Healer";
  const hasDefensiveCooldowns: Predicate<Character> = (
    t: Character,
    index: number,
    array: Character[],
  ) => hasBarkskin(t, index, array) || hasPainSuppression(t, index, array);
  const defensiveCooldownUsers = sortByClasses(
    roster.filter(hasDefensiveCooldowns),
    ["Priest", "Druid"],
  );

  // Assign the defensive cooldowns to the hateful strike tanks. However if the
  // cooldown assignee is already on someone keep them there.
  const tankAssignmentsWithCooldowns = tankAssignments.map((t) => ({
    ...t,
    cooldownAssignments: defensiveCooldownUsers.filter((x) =>
      t.healers.find((y) => y.name === x.name),
    ),
  }));
  const assignedHealersWithCooldowns = new Set(
    tankAssignmentsWithCooldowns.flatMap((t) => t.healers).map((t) => t.name),
  );
  const availableCooldownAssignees = defensiveCooldownUsers.filter(
    (t) => !assignedHealersWithCooldowns.has(t.name),
  );
  const NUMBER_OF_DEFENSIVE_COOLDOWNS_PER_TANK = Math.ceil(
    availableCooldownAssignees.length / hatefulStrikeTanks.length,
  );
  const hatefulStrikeTankAssignments = tankAssignmentsWithCooldowns
    .filter((t) => !t.isMainTank)
    .map((t, index) => ({
      ...t,
      cooldownAssignments: [
        ...t.cooldownAssignments,
        ...availableCooldownAssignees.slice(
          index * NUMBER_OF_DEFENSIVE_COOLDOWNS_PER_TANK,
          index * NUMBER_OF_DEFENSIVE_COOLDOWNS_PER_TANK +
            NUMBER_OF_DEFENSIVE_COOLDOWNS_PER_TANK,
        ),
      ].reverse(),
    }));
  const mainTankAssignment = tankAssignmentsWithCooldowns.find(
    (t) => t.isMainTank,
  )!;

  const raidTargets = Object.values(ALL_RAID_TARGETS).reverse();
  const BASE_INDEX = 1;

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
          characters: [mainTankAssignment.tank],
        },
        {
          id: `Healed by`,
          description: "healed by",
          characters: mainTankAssignment.healers,
        },
        {
          id: `Defensive cooldown rotation (last 30%) Suppression / Barkskin for ${mainTankAssignment.tank.name} by`,
          description: `defensive cooldowns (last ${calculateWhenToApplyCooldowns([...mainTankAssignment.cooldownAssignments], FIGHT_DURATION_ESTIMATION)}%) by`,
          characters: mainTankAssignment.cooldownAssignments,
        },
      ],
    },
    ...hatefulStrikeTankAssignments.map((currTank, index) => ({
      raidTarget: {
        icon: raidTargets[BASE_INDEX + index],
        name: `Hateful Strike Tank ${index + 1}`,
      },
      assignments: [
        {
          id: `Hateful Strike Tank ${index + 1}`,
          description: "Hateful Strike Tank",
          characters: [currTank.tank],
        },
        {
          id: `Healed by`,
          description: `healed by`,
          characters: currTank.healers,
        },
        {
          id: `Defensive cooldown rotation (last ${calculateWhenToApplyCooldowns([...currTank.cooldownAssignments], FIGHT_DURATION_ESTIMATION)}%) Suppression / Barkskin for ${currTank.tank.name} by`,
          description: `defensive cooldowns (last ${calculateWhenToApplyCooldowns([...currTank.cooldownAssignments], FIGHT_DURATION_ESTIMATION)}%) by`,
          characters: currTank.cooldownAssignments,
        },
      ],
    })),
  ];
}

export function exportToDiscord(
  patchwerkAssignment: TargetAssignment[],
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
