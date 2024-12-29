/* eslint-disable no-console */
import { Database } from "../exports/mem-database";
import { fetchCharacterData } from "../raider-io/raider-io-client";
import { getRoleFromCharacter } from "../raider-io/utils";
import { Player } from "../sheets/get-players";
import { Character } from "../classic-wow/raid-assignment";
import { getCthunAssignment } from "../classic-wow/raids/temple-of-aq/cthun";
import { getSarturaAssignment } from "../classic-wow/raids/temple-of-aq/sartura";
import { CommandHandler, CommandOptions, StringReply } from "./commandHandler";
import { getGenericRaidAssignment } from "../classic-wow/raids/generic";

type RaidAssignment = (roster: Character[], players: Player[]) => string;

export const ENCOUNTER_HANDLERS: { [key: string]: RaidAssignment } = {
  "raid": getGenericRaidAssignment,
  "aq-sartura": getSarturaAssignment,
  "aq-cthun": getCthunAssignment,
};

export const SUPPORTED_ENCOUNTERS = Object.keys(ENCOUNTER_HANDLERS);

// If I'd export this to other guilds I'd probably make this somewhat configurable
// On the bot state.
const REALM_NAME = "wild-growth";
const REGION = "eu";

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
        return null;
      }
    }),
  );

  return allInfos
    .filter((t) => t !== null)
    .map((t) => ({
      name: t.characterDetails.character.name,
      role: getRoleFromCharacter(t),
      class: t.characterDetails.character.class.name,
    }));
}

export const raidAssignHandler: CommandHandler<Database> = async (
  options: CommandOptions,
  reply: StringReply,
  database: Database,
): Promise<void> => {
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

  const parsedRoster = roster
    .split(" ")
    .map((t) => t.trim())
    .filter((t) => Boolean(t))
    .filter((t) => t.startsWith("@"));

  const players = database.getPlayersRoster();
  const serverHandleMap = new Map(players.map((t) => [t.serverHandle, t]));
  const mappedRoster = parsedRoster
    .map((t) => serverHandleMap.get(t))
    .filter((t): t is Player => Boolean(t));

  // Maybe these HTTP requests can be cached?
  const characters = await getCharacterInfos(mappedRoster.map((t) => t.characters[0]));
  const assignments = getAssignmentForEncounter(characters, mappedRoster);

  await reply(assignments);
};
