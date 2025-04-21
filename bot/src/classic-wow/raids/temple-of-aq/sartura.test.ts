import { Character } from "../../raid-assignment";
import { makeAssignments } from "./sartura";

describe("sartura", () => {
  describe("makeAssignments", () => {
    it("Assigns a roster of 20 with 4 stunners to the fight", () => {
      const tankNames = ["Darkshivan", "Svajone", "Dirkwarlock"]; // 3
      const stunnerNames = ["Lutaryon", "Wwolf", "Ashgiver", "Pest"]; // 4
      const meleeDpsNames = ["Tearyn", "Boomstronk", "Broederbeer"]; // 3
      const rangedDpsNames = [
        "Asti",
        "Rendan",
        "Ciridia",
        "Verylongname",
        "Aquantos",
        "Eyvor",
      ]; // 6
      const healerNames = ["Wolfsun", "Milfred", "Ymelia", "Izaaner"]; // 4

      const roster: Character[] = [
        ...tankNames.map<Character>((name) => ({
          name,
          class: "Druid",
          role: "Tank",
        })),
        ...stunnerNames.map<Character>((name) => ({
          name,
          class: "Rogue",
          role: "Melee",
        })),
        ...meleeDpsNames.map<Character>((name) => ({
          name,
          class: "Warrior",
          role: "Melee",
        })),
        ...rangedDpsNames.map<Character>((name) => ({
          name,
          class: "Priest",
          role: "Ranged",
        })),
        ...healerNames.map<Character>((name) => ({
          name,
          class: "Priest",
          role: "Healer",
        })),
      ];
      const assignments = makeAssignments(roster, "Svajone");

      expect(assignments).toMatchObject([
        {
          raidTarget: {
            icon: {
              name: "Triangle",
              symbol: "{triangle}",
              discordEmoji: "<:Triangle:1345772816867528836>",
            },
            name: "Sartura",
          },
          assignments: [
            {
              id: "Tanks",
              description: "tanked by",
              characters: [
                {
                  name: "Svajone",
                  class: "Druid",
                  role: "Tank",
                },
              ],
            },
          ],
        },
        {
          raidTarget: {
            icon: {
              name: "Skull",
              symbol: "{skull}",
              discordEmoji: "<:Skull:1345772813130399878>",
            },
            name: "Add 1",
          },
          assignments: [
            {
              id: "Tanks",
              description: "tanked by",
              characters: [
                {
                  name: "Darkshivan",
                  class: "Druid",
                  role: "Tank",
                },
              ],
            },
            {
              id: "Stunners",
              description: "stunned by",
              characters: [
                {
                  name: "Lutaryon",
                  class: "Rogue",
                  role: "Melee",
                },
              ],
            },
          ],
        },
        {
          raidTarget: {
            icon: {
              name: "Cross",
              symbol: "{cross}",
              discordEmoji: "<:Cross:1345772808231321762>",
            },
            name: "Add 2",
          },
          assignments: [
            {
              id: "Tanks",
              description: "tanked by",
              characters: [
                {
                  name: "Dirkwarlock",
                  class: "Druid",
                  role: "Tank",
                },
              ],
            },
            {
              id: "Stunners",
              description: "stunned by",
              characters: [
                {
                  name: "Wwolf",
                  class: "Rogue",
                  role: "Melee",
                },
              ],
            },
          ],
        },
        {
          raidTarget: {
            icon: {
              name: "Square",
              symbol: "{square}",
              discordEmoji: "<:Square:1345772815349059667>",
            },
            name: "Add 3",
          },
          assignments: [
            {
              id: "Tanks",
              description: "tanked by",
              characters: [
                {
                  name: "Dirkwarlock",
                  class: "Druid",
                  role: "Tank",
                },
              ],
            },
            {
              id: "Stunners",
              description: "stunned by",
              characters: [
                {
                  name: "Ashgiver",
                  class: "Rogue",
                  role: "Melee",
                },
                {
                  class: "Rogue",
                  name: "Pest",
                  role: "Melee",
                },
              ],
            },
          ],
        },
      ]);
    });

    it("Assigns a roster of 20 with 7 stunners to the fight", () => {
      const tankNames = ["Darkshivan", "Svajone", "Dirkwarlock"]; // 3
      const stunnerNames = [
        "Lutaryon",
        "Wwolf",
        "Ashgiver",
        "Pest",
        "Rethie",
        "Nibsinobsi",
        "Orcbolg",
      ]; // 7
      const meleeDpsNames = ["Tearyn", "Boomstronk", "Broederbeer"]; // 3
      const rangedDpsNames = [
        "Asti",
        "Rendan",
        "Ciridia",
        "Verylongname",
        "Aquantos",
        "Eyvor",
      ]; // 6
      const healerNames = ["Wolfsun", "Milfred", "Ymelia", "Izaaner"]; // 4

      const roster: Character[] = [
        ...tankNames.map<Character>((name) => ({
          name,
          class: "Druid",
          role: "Tank",
        })),
        ...stunnerNames.map<Character>((name) => ({
          name,
          class: "Rogue",
          role: "Melee",
        })),
        ...meleeDpsNames.map<Character>((name) => ({
          name,
          class: "Warrior",
          role: "Melee",
        })),
        ...rangedDpsNames.map<Character>((name) => ({
          name,
          class: "Priest",
          role: "Ranged",
        })),
        ...healerNames.map<Character>((name) => ({
          name,
          class: "Priest",
          role: "Healer",
        })),
      ];
      const assignments = makeAssignments(roster, "Svajone");

      expect(assignments).toMatchObject([
        {
          raidTarget: {
            icon: {
              name: "Triangle",
              symbol: "{triangle}",
              discordEmoji: "<:Triangle:1345772816867528836>",
            },
            name: "Sartura",
          },
          assignments: [
            {
              id: "Tanks",
              description: "tanked by",
              characters: [
                {
                  name: "Svajone",
                  class: "Druid",
                  role: "Tank",
                },
              ],
            },
          ],
        },
        {
          raidTarget: {
            icon: {
              name: "Skull",
              symbol: "{skull}",
              discordEmoji: "<:Skull:1345772813130399878>",
            },
            name: "Add 1",
          },
          assignments: [
            {
              id: "Tanks",
              description: "tanked by",
              characters: [
                {
                  name: "Darkshivan",
                  class: "Druid",
                  role: "Tank",
                },
              ],
            },
            {
              id: "Stunners",
              description: "stunned by",
              characters: [
                {
                  name: "Lutaryon",
                  class: "Rogue",
                  role: "Melee",
                },
                {
                  name: "Wwolf",
                  class: "Rogue",
                  role: "Melee",
                },
              ],
            },
          ],
        },
        {
          raidTarget: {
            icon: {
              name: "Cross",
              symbol: "{cross}",
              discordEmoji: "<:Cross:1345772808231321762>",
            },
            name: "Add 2",
          },
          assignments: [
            {
              id: "Tanks",
              description: "tanked by",
              characters: [
                {
                  name: "Dirkwarlock",
                  class: "Druid",
                  role: "Tank",
                },
              ],
            },
            {
              id: "Stunners",
              description: "stunned by",
              characters: [
                {
                  name: "Ashgiver",
                  class: "Rogue",
                  role: "Melee",
                },
                {
                  name: "Pest",
                  class: "Rogue",
                  role: "Melee",
                },
              ],
            },
          ],
        },
        {
          raidTarget: {
            icon: {
              name: "Square",
              symbol: "{square}",
              discordEmoji: "<:Square:1345772815349059667>",
            },
            name: "Add 3",
          },
          assignments: [
            {
              id: "Tanks",
              description: "tanked by",
              characters: [
                {
                  name: "Dirkwarlock",
                  class: "Druid",
                  role: "Tank",
                },
              ],
            },
            {
              id: "Stunners",
              description: "stunned by",
              characters: [
                {
                  name: "Rethie",
                  class: "Rogue",
                  role: "Melee",
                },
                {
                  name: "Nibsinobsi",
                  class: "Rogue",
                  role: "Melee",
                },
                {
                  name: "Orcbolg",
                  class: "Rogue",
                  role: "Melee",
                },
              ],
            },
          ],
        },
      ]);
    });
  });
});
