/* eslint-disable no-console */
import { Database } from "./exports/mem-database";
import { refreshDatabase } from "./exports/utils";
import { Character } from "./classic-wow/raid-assignment";
import {
  exportToDiscord as exportToDiscordCthun,
  makeAssignments as makeAssignmentsCthun,
} from "./classic-wow/raids/temple-of-aq/cthun";
import {
  exportToDiscord as exportToDiscordSartura,
  makeAssignments as makeAssignmentsSartura,
} from "./classic-wow/raids/temple-of-aq/sartura";
import { exportToLuaTable } from "./classic-wow/raids/utilts";
import { getRoleFromCharacter } from "./integrations/raider-io/utils";
import { fetchCharacterData } from "./integrations/raider-io/raider-io-client";
import { CharacterDetails } from "./integrations/raider-io/types";

// Manual overrides
const overrideConfig: Character[] = [
  { name: "Bibimbap", role: "Melee", class: "Warrior" },
  { name: "Milfred", role: "Ranged", class: "Mage" },
  { name: "Datoliina", role: "Melee", class: "Warrior" },
  { name: "Justhealing", role: "Healer", class: "Druid" },
];

export function override(
  roster: Character[],
  config: Character[] = overrideConfig,
): Character[] {
  const map = new Map(config.map((t) => [t.name, t]));

  return roster.map((t) => map.get(t.name) ?? t);
}

interface Failure {
  failure: true;
  name: string;
}

async function main() {
  const characterHandles = `@Darkshivan @Svajone @Dirkwarlock @Justhealing @Grumbus<FB> @Kimepo/jenhi<FB> @Wolfsun @wwolf @Bibimbap @Mich @Datoliina @Vysha/Sterot<FB> @Paynex @Tearyn @Ashgiver @Lutaryon @Broederbeer @boomstronk @Goodmann @Barakary/Eydrak @Snace/Velarok @Krint(FB) @Orcbolg / Asti @Eyvor @Lockfel @Pignose @Libriyum<FB> @Dougie/Verylongname @zugpriest @Laranel<FB> @Milfred/Souzy`;
  const allHandles = characterHandles
    .split(" ")
    .map((t) => t.trim())
    .filter(Boolean);

  // Load the database
  const database = new Database();
  await refreshDatabase(database);

  const discordHandlesMap = new Map(
    database.getPlayersRoster().map((t) => [t.serverHandle, t.characters[0]]),
  );

  const characterNames = allHandles
    .map((t) => {
      const found = discordHandlesMap.get(t);

      if (!found) {
        console.warn(`Discord handle ${t} was not found!`);
        return null;
      }

      return found;
    })
    .filter((t): t is string => t !== null);

  const allInfos = await Promise.all(
    characterNames.map(async (characterName: string) => {
      try {
        return await fetchCharacterData("eu", "wild-growth", characterName);
      } catch (err: unknown) {
        console.error(
          `Failed to fetch data for ${characterName}, reason: ${err}`,
        );
        // Can override this by considering this person is a "hunter" - hunters are almost like misc so that works.
        return {
          failure: true,
          name: characterName,
        };
      }
    }),
  );

  const rawRoster: Character[] = allInfos.map((t) =>
    !(t as Failure).failure
      ? {
          name: (t as CharacterDetails).characterDetails.character.name,
          role: getRoleFromCharacter(t as CharacterDetails),
          class: (t as CharacterDetails).characterDetails.character.class.name,
        }
      : {
          name: (t as Failure).name,
          role: "Ranged",
          class: "Hunter",
        },
  );

  const roster = override(rawRoster);
  const sarturaAssigments = makeAssignmentsSartura(roster);

  console.log(
    exportToDiscordSartura(sarturaAssigments, database.getPlayersRoster()),
  );

  const cthunAssignments = makeAssignmentsCthun(roster);

  console.log(exportToDiscordCthun(cthunAssignments));
  console.log(exportToLuaTable(cthunAssignments));
}

// Command: Given a Roster it will:
// /raid-assign [Encounter][Roster] (would be perfect if we could read from the channel actually!!)
// 1. [X] Create assignments for Stuns
// 2. [X] Create C'thun assignment
// 3. [ ] Create Twins assignment
// 4. [ ] Create Sulfuron assignment (super optional)

// WoW Addon
// 1. [X] UI to paste a JSON (opted with LUA table) and should a setup id
// 2. [X] Parse the JSON and use SetRaidSubgroup
// 3. [X] Figure out what ID everyone has
// 4. [X] Maybe have a slash command with a set, like /raidsort load -> setup one

// Map of class and things they can do

// Make an addon
// https://wowpedia.fandom.com/wiki/API_SetRaidSubgroup
// What is the ID!?
// ChatGPT investigation:
// https://chatgpt.com/c/676cb0ac-6ed8-8003-886a-e249daca1145

main().catch((t: unknown) => console.error(t));
