import { isHealerCharacter, isMeleeCharacter } from "../../class-role";
import { Character } from "../../raid-assignment";
import {
  ABSOLUTE_MAXIMUM_AMOUNT_OF_MELEE_IN_GROUP,
  makeAssignments,
} from "./cthun";

const LARGE_ROSTER: Character[] = [
  // Tanks
  {
    name: "Svajone",
    class: "Druid",
    role: "Tank",
  },
  {
    name: "Darkshivan",
    class: "Warrior",
    role: "Tank",
  },
  {
    name: "Dirkwarlock",
    class: "Warlock",
    role: "Tank",
  },
  // Melee DPS
  {
    name: "wwolf",
    class: "Rogue",
    role: "Melee",
  },
  {
    name: "Bibimbap",
    class: "Warrior",
    role: "Melee",
  },
  {
    name: "Mich",
    class: "Warrior",
    role: "Melee",
  },
  {
    name: "Datoliina",
    class: "Warrior",
    role: "Melee",
  },
  {
    name: "Vysha",
    class: "Warrior",
    role: "Melee",
  },
  {
    name: "Paynex",
    class: "Warrior",
    role: "Melee",
  },
  {
    name: "Tearyn",
    class: "Warrior",
    role: "Melee",
  },
  {
    name: "Ashgiver",
    class: "Paladin",
    role: "Melee",
  },
  {
    name: "Lutaryon",
    class: "Paladin",
    role: "Melee",
  },
  {
    name: "Broederbeer",
    class: "Druid",
    role: "Melee",
  },
  {
    name: "Boomstronk",
    class: "Druid",
    role: "Melee",
  },
  {
    name: "Goodmann",
    class: "Druid",
    role: "Melee",
  },
  {
    name: "Barakary",
    class: "Druid",
    role: "Melee",
  },
  {
    name: "Snace",
    class: "Hunter",
    role: "Melee",
  },
  {
    name: "Krint",
    class: "Hunter",
    role: "Melee",
  },
  // Ranged
  {
    name: "Asti",
    class: "Hunter",
    role: "Ranged",
  },
  {
    name: "Eyvor",
    class: "Druid",
    role: "Ranged",
  },
  {
    name: "Lockfel",
    class: "Warlock",
    role: "Ranged",
  },
  {
    name: "Pignose",
    class: "Warlock",
    role: "Ranged",
  },
  {
    name: "Libriyum",
    class: "Priest",
    role: "Ranged",
  },
  {
    name: "Dougie",
    class: "Priest",
    role: "Ranged",
  },
  {
    name: "Zugpriest",
    class: "Priest",
    role: "Ranged",
  },
  {
    name: "Laranel",
    class: "Mage",
    role: "Ranged",
  },
  {
    name: "Milfred",
    class: "Mage",
    role: "Ranged",
  },
  // Healer
  {
    name: "Justhealing",
    class: "Paladin",
    role: "Healer",
  },
  {
    name: "Grumbus",
    class: "Paladin",
    role: "Healer",
  },
  {
    name: "Kimepo",
    class: "Druid",
    role: "Healer",
  },
  {
    name: "Wolfsun",
    class: "Priest",
    role: "Healer",
  },
];

const SMALL_ROSTER: Character[] = [
  // Tanks
  {
    name: "Svajone",
    class: "Druid",
    role: "Tank",
  },
  {
    name: "Darkshivan",
    class: "Warrior",
    role: "Tank",
  },
  {
    name: "Dirkwarlock",
    class: "Warlock",
    role: "Tank",
  },
  // Melee DPS
  {
    name: "wwolf",
    class: "Rogue",
    role: "Melee",
  },
  {
    name: "Datoliina",
    class: "Warrior",
    role: "Melee",
  },
  {
    name: "Tearyn",
    class: "Warrior",
    role: "Melee",
  },
  {
    name: "Ashgiver",
    class: "Paladin",
    role: "Melee",
  },
  {
    name: "Lutaryon",
    class: "Paladin",
    role: "Melee",
  },
  {
    name: "Broederbeer",
    class: "Druid",
    role: "Melee",
  },
  {
    name: "Boomstronk",
    class: "Druid",
    role: "Melee",
  },
  // Ranged
  {
    name: "Asti",
    class: "Hunter",
    role: "Ranged",
  },
  {
    name: "Eyvor",
    class: "Druid",
    role: "Ranged",
  },
  {
    name: "Lockfel",
    class: "Warlock",
    role: "Ranged",
  },
  {
    name: "Dougie",
    class: "Priest",
    role: "Ranged",
  },
  {
    name: "Zugpriest",
    class: "Priest",
    role: "Ranged",
  },
  {
    name: "Milfred",
    class: "Mage",
    role: "Ranged",
  },
  // Healer
  {
    name: "Justhealing",
    class: "Paladin",
    role: "Healer",
  },
  {
    name: "Grumbus",
    class: "Paladin",
    role: "Healer",
  },
  {
    name: "Kimepo",
    class: "Druid",
    role: "Healer",
  },
  {
    name: "Wolfsun",
    class: "Priest",
    role: "Healer",
  },
];

const SMALL_ROSTER_MELEE_HEAVY: Character[] = [
  // Tanks
  {
    name: "Svajone",
    class: "Druid",
    role: "Tank",
  },
  {
    name: "Darkshivan",
    class: "Warrior",
    role: "Tank",
  },
  {
    name: "Dirkwarlock",
    class: "Warlock",
    role: "Tank",
  },
  // Melee DPS
  {
    name: "wwolf",
    class: "Rogue",
    role: "Melee",
  },
  {
    name: "Datoliina",
    class: "Warrior",
    role: "Melee",
  },
  {
    name: "Tearyn",
    class: "Warrior",
    role: "Melee",
  },
  {
    name: "Ashgiver",
    class: "Paladin",
    role: "Melee",
  },
  {
    name: "Lutaryon",
    class: "Paladin",
    role: "Melee",
  },
  {
    name: "Broederbeer",
    class: "Druid",
    role: "Melee",
  },
  {
    name: "Boomstronk",
    class: "Druid",
    role: "Melee",
  },
  {
    name: "Extraone",
    class: "Druid",
    role: "Melee",
  },
  {
    name: "Extratwo",
    class: "Druid",
    role: "Melee",
  },
  {
    name: "Extrathree",
    class: "Druid",
    role: "Melee",
  },
  {
    name: "Extrafour",
    class: "Druid",
    role: "Melee",
  },
  // Ranged
  {
    name: "Asti",
    class: "Hunter",
    role: "Ranged",
  },
  {
    name: "Eyvor",
    class: "Druid",
    role: "Ranged",
  },
  // Healer
  {
    name: "Justhealing",
    class: "Paladin",
    role: "Healer",
  },
  {
    name: "Grumbus",
    class: "Paladin",
    role: "Healer",
  },
  {
    name: "Kimepo",
    class: "Druid",
    role: "Healer",
  },
  {
    name: "Wolfsun",
    class: "Priest",
    role: "Healer",
  },
];

describe("cthun", () => {
  describe("makeAssignments", () => {
    it.each([
      ["Large Roster", LARGE_ROSTER, 8],
      ["Small Roster", SMALL_ROSTER, 4],
      ["Small Roster Melee Heavy", SMALL_ROSTER_MELEE_HEAVY, 6],
    ])(
      "Given a %s, it will find the best way to fit a Cthun group",
      (_, roster, expectedGroupCount) => {
        const assignments = makeAssignments(roster);

        expect(assignments.groups).toHaveLength(expectedGroupCount);
        const groupsHaveAtMostThreeMelee = assignments.groups
          .map(
            (t) =>
              t.slots.filter(isMeleeCharacter).length <=
              ABSOLUTE_MAXIMUM_AMOUNT_OF_MELEE_IN_GROUP,
          )
          .every(Boolean);
        expect(groupsHaveAtMostThreeMelee).toBe(true);
        const groupsHaveAtMostOneHealer = assignments.groups
          .map((t) => t.slots.filter(isHealerCharacter).length <= 1)
          .every(Boolean);
        expect(groupsHaveAtMostOneHealer).toBe(true);

        const allNames = assignments.groups
          .map((t) =>
            t.slots
              .filter((x): x is Character => Boolean(x))
              .map((x) => x.name),
          )
          .flatMap((t) => t);
        const allUniqueNames = new Set(allNames);

        expect(allUniqueNames.size).toBe(allNames.length);
        expect(allUniqueNames.size).toBe(roster.length);
      },
    );
  });
});
