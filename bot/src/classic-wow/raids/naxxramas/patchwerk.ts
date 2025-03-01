import { Player } from "../../../integrations/sheets/get-players";
import { filterTwo, Predicate } from "../../../lib/array-utils";
import {
  ALL_RAID_TARGETS,
  AssignmentDetails,
  Character,
  TargetAssignment,
} from "../../raid-assignment";
import { RaidAssignmentResult } from "../assignment-config";
import { RaidAssignmentRoster } from "../raid-assignment-roster";

const FIGHT_DURATION_ESTIMATION = 80;
const NUMBER_OF_HATEFUL_STRIKE_TANKS = 1;

function calculateWhenToApplyCooldowns(
  cooldowns: Character[],
  totalFightDurationInSeconds: number,
): number {
  const classCooldownDurationMap: { [key: string]: number } = {
    Druid: 8,
    Priest: 15,
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

function sortHealersBasedOnSingleTarget(healers: Character[]): Character[] {
  return healers.sort((a, b) => {
    if (b.class === "Paladin") {
      return +1;
    }
    if (a.class === "Paladin") {
      return -1;
    }
    if (b.class === "Priest") {
      return +1;
    }
    if (a.class === "Priest") {
      return -1;
    }
    if (b.class === "Druid") {
      return +1;
    }
    if (a.class === "Druid") {
      return -1;
    }

    return 0;
  });
}

function sortDefensiveCooldownUsers(cooldownUsers: Character[]): Character[] {
  return cooldownUsers.sort((a, b) => {
    if (b.class === "Priest") {
      return +1;
    }
    if (a.class === "Priest") {
      return -1;
    }
    if (b.class === "Druid") {
      return +1;
    }
    if (a.class === "Druid") {
      return -1;
    }

    return 0;
  });
}

export function makeAssignments(roster: Character[]): TargetAssignment[] {
  const tanks = roster.filter((t) => t.role === "Tank");
  const [mainTanks, hatefulStrikeTanks] = filterTwo(
    tanks,
    (t) => t.class !== "Druid" && t.class !== "Rogue" && t.class !== "Warrior",
  );

  const [mainTank, ...rest] = mainTanks;
  const allHatefulStrikeTanks = [...rest, ...hatefulStrikeTanks].slice(
    0,
    NUMBER_OF_HATEFUL_STRIKE_TANKS,
  );

  const healers = roster.filter((t) => t.role === "Healer");
  const sortedHealers = sortHealersBasedOnSingleTarget(healers);

  // Split sorted tanks by number of hateful strike tanks.
  const NUMBER_OF_HEALERS_PER_TANK = Math.floor(
    healers.length / (allHatefulStrikeTanks.length + 1),
  );
  const tankAssignments = [...allHatefulStrikeTanks, mainTank].map(
    (x, index) => ({
      tank: x,
      healers: sortedHealers.slice(
        index * NUMBER_OF_HEALERS_PER_TANK,
        index * NUMBER_OF_HEALERS_PER_TANK + NUMBER_OF_HEALERS_PER_TANK,
      ),
      isMainTank: x.name === mainTank.name,
    }),
  );

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
  const defensiveCooldownUsers = sortDefensiveCooldownUsers(
    roster.filter(hasDefensiveCooldowns),
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
    availableCooldownAssignees.length / allHatefulStrikeTanks.length,
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
          description: `defensive cooldowns (last ${calculateWhenToApplyCooldowns([mainTankAssignment.tank, ...mainTankAssignment.cooldownAssignments], FIGHT_DURATION_ESTIMATION)}%) by`,
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
          id: `Defensive cooldown rotation (last ${calculateWhenToApplyCooldowns([currTank.tank, ...currTank.cooldownAssignments], FIGHT_DURATION_ESTIMATION)}%) Suppression / Barkskin for ${currTank.tank.name} by`,
          description: `defensive cooldowns (last ${calculateWhenToApplyCooldowns([currTank.tank, ...currTank.cooldownAssignments], FIGHT_DURATION_ESTIMATION)}%) by`,
          characters: currTank.cooldownAssignments,
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
