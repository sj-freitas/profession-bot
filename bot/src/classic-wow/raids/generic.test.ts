import { Character } from "../raid-assignment";
import { makeAssignments } from "./generic";

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

describe("generic", () => {
  describe("makeAssignments", () => {
    it("Given a raid of several people, it finds the best setup possible", () => {
      const raid = makeAssignments({ characters: LARGE_ROSTER, players: [] });
      const allNames = raid.groups
        .map((t) =>
          t.slots.filter((x): x is Character => Boolean(x)).map((x) => x.name),
        )
        .flatMap((t) => t);
      const allUniqueNames = new Set(allNames);

      expect(allUniqueNames.size).toBe(allNames.length);
      expect(allUniqueNames.size).toBe(LARGE_ROSTER.length);
    });
  });
});
