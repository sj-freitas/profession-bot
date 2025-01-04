/* eslint-disable no-console */
import { Database } from "../exports/mem-database";
import { fetchCharacterData } from "../integrations/raider-io/raider-io-client";
import { getRoleFromCharacter } from "../integrations/raider-io/utils";
import { Player } from "../integrations/sheets/get-players";
import { Character } from "../classic-wow/raid-assignment";
import { getCthunAssignment } from "../classic-wow/raids/temple-of-aq/cthun";
import { getSarturaAssignment } from "../classic-wow/raids/temple-of-aq/sartura";
import { CommandHandler } from "./commandHandler";
import { getGenericRaidAssignment } from "../classic-wow/raids/generic";
import { parseDiscordHandles } from "./utils";
import { CharacterDetails } from "../integrations/raider-io/types";

type RaidAssignment = (roster: Character[], players: Player[]) => string;

export const ENCOUNTER_HANDLERS: { [key: string]: RaidAssignment } = {
  raid: getGenericRaidAssignment,
  "aq-sartura": getSarturaAssignment,
  "aq-cthun": getCthunAssignment,
};

export const SUPPORTED_ENCOUNTERS = Object.keys(ENCOUNTER_HANDLERS);

// If I'd export this to other guilds I'd probably make this somewhat configurable
// On the bot state.
const REALM_NAME = "wild-growth";
const REGION = "eu";

interface Failure {
  failure: true;
  name: string;
}

async function getCharacterInfos(
  characterNames: string[],
): Promise<Character[]> {
  const allInfos = await Promise.all(
    characterNames.map(async (characterName: string) => {
      try {
        return await fetchCharacterData(REGION, REALM_NAME, characterName);
      } catch (err: unknown) {
        // Implement a fallback by having some hardcoded character data?
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

  return allInfos
    .filter((t) => t !== null)
    .map((t) =>
      !(t as Failure).failure
        ? {
            name: (t as CharacterDetails).characterDetails.character.name,
            role: getRoleFromCharacter(t as CharacterDetails),
            class: (t as CharacterDetails).characterDetails.character.class
              .name,
          }
        : {
            name: (t as Failure).name,
            role: "Ranged",
            class: "Mage",
          },
    );
}

export const raidAssignHandler: CommandHandler<Database> = async ({
  options,
  reply,
  payload: database,
}): Promise<void> => {
  const encounter = options.getString("encounter");
  if (encounter === null) {
    await reply("Failed to provide a value for encounter.");
    return;
  }

  const getAssignmentForEncounter = ENCOUNTER_HANDLERS[encounter];
  if (!getAssignmentForEncounter) {
    await reply(
      `Encounter ${encounter} isn't supported, supported encounters are: ${SUPPORTED_ENCOUNTERS.join(" | ")}`,
    );
    return;
  }

  const roster = options.getString("roster");
  if (roster === null) {
    await reply("Failed to provide a valid roster.");
    return;
  }

  const parsedRoster = parseDiscordHandles(roster);
  const players = database.getPlayersRoster();
  const serverHandleMap = new Map(players.map((t) => [t.serverHandle, t]));
  const mappedRoster = parsedRoster
    .map((t) => serverHandleMap.get(t))
    .filter((t): t is Player => Boolean(t));

  // Maybe these HTTP requests can be cached?
  const characters = await getCharacterInfos(
    mappedRoster.map((t) => t.characters[0]),
  );
  const assignments = getAssignmentForEncounter(characters, mappedRoster);

  await reply(assignments);
};
