/* eslint-disable no-console */
import { createHash } from "crypto";
import { Character } from "../classic-wow/raid-assignment";
import { ClassName, RaidEvent } from "../integrations/raid-helper/types";
import {
  inferWowClassFromSpec,
  isConfirmedSignup,
} from "../integrations/raid-helper/utils";
import { Class } from "../integrations/raider-io/types";
import { Player } from "../integrations/sheets/get-players";
import { CONFIG } from "../config";
import { fetchCharacterData } from "../integrations/raider-io/raider-io-client";
import { RaidRole } from "../integrations/raider-io/utils";
import { Database } from "../exports/mem-database";
import { RaidAssignmentRoster } from "../classic-wow/raids/raid-assignment-roster";

const DEFAULT_CLASS_IN_CASE_OF_CHARACTER_NOT_FOUND = "Mage";

interface SimplifiedSignUp {
  wowClass: Class;
  simplifiedDiscordHandle: string;
  role: ClassName;
  userId?: string;
}

function slugify(text: string): string {
  return text
    .split(" ")
    .map((t) => t.toLowerCase())
    .join("-");
}

async function safeCharacterFetch(
  characterName: string,
  region: string,
  realmName: string,
): Promise<Omit<Character, "role">> {
  const result = await fetchCharacterData(
    region,
    slugify(realmName),
    characterName,
  );

  if (!result) {
    // Can override this by considering this person is a "mage" - mage are almost like misc so that works.
    // mages don't buff but can also benefit from buffs. This however probably gets "fixed" when crossed with
    // the character data.
    return {
      name: characterName,
      class: DEFAULT_CLASS_IN_CASE_OF_CHARACTER_NOT_FOUND,
    };
  }

  return {
    name: characterName,
    class: result.characterDetails.character.class.name,
  };
}

function createSignUpsHash(array: SimplifiedSignUp[]): string {
  const sorted = array.sort((left, right) =>
    // Sort the array to ensure that the order changing doesn't change the roster hash
    left.simplifiedDiscordHandle.localeCompare(right.simplifiedDiscordHandle),
  );

  return createHash("sha256").update(JSON.stringify(sorted)).digest("base64");
}

export interface CharacterWithMetadata extends Character {
  isMainCharacter: boolean;
  player: Player;
}

export interface Roster {
  characters: CharacterWithMetadata[];
  rosterHash: string;
}

export async function getRosterFromRaidEvent(
  raidEvent: RaidEvent,
  database: Database,
  includeAbsences = false,
): Promise<Roster> {
  const signUps = raidEvent.signUps
    .filter((t) => includeAbsences || isConfirmedSignup(t))
    .map((t) => ({
      wowClass: inferWowClassFromSpec(t.specName!),
      simplifiedDiscordHandle: t.name.toLowerCase(),
      role: t.className,
      userId: t.userId,
    }));

  // Create a hash from this - this is the roster.
  type Potato = SimplifiedSignUp & { player: Player };

  const hash = createSignUpsHash(signUps);
  const allPlayers = database.getPlayersRoster();
  const playerMap = new Map(allPlayers.map((t) => [t.discordId, t]));
  const matchedPlayers = signUps
    .map(
      (t) =>
        ({
          ...t,
          player: playerMap.get(t.userId!),
        }) as Potato,
    )
    .filter((t): t is Potato => {
      if (!t.player) {
        console.log(
          `Player ${t.simplifiedDiscordHandle} could not be found in our sheet!`,
        );
        return false;
      }
      return true;
    })
    .map((t) => ({
      ...t,
      player: {
        ...t.player,
        discordId: t.userId,
      },
    }));

  // Go to raider IO to determine what character to use
  const characters: CharacterWithMetadata[] = (
    await Promise.all(
      matchedPlayers.map(async (t) => {
        if (t.player.characters.length === 1) {
          return {
            name: t.player.characters[0],
            class: t.wowClass,
            role: t.role as RaidRole,
            isMainCharacter: true,
            player: t.player,
          };
        }

        // Given that the player might have more than one raiding char
        // Fetch all the raiding chars from raider-io or cache.
        const allCharactersOfPlayer = await Promise.all(
          t.player.characters.map(
            async (characterName) =>
              await safeCharacterFetch(
                characterName,
                CONFIG.GUILD.REGION,
                CONFIG.GUILD.REALM,
              ),
          ),
        );

        // In case no character class matches, we just take the first one assuming
        // that the player is playing on his main.
        const matchingCharacter =
          allCharactersOfPlayer.find(
            (characterInfo) => characterInfo.class === t.wowClass,
          ) ?? allCharactersOfPlayer[0];

        const characterWithMetadata = {
          name: matchingCharacter.name,
          class: t.wowClass,
          role: t.role as RaidRole,
          player: t.player,
          isMainCharacter: matchingCharacter.name === t.player.characters[0],
        };

        return characterWithMetadata;
      }),
    )
  ).filter((t): t is CharacterWithMetadata => Boolean(t));

  return {
    rosterHash: hash,
    characters,
  };
}

export function toRaidAssignmentRoster(roster: Roster): RaidAssignmentRoster {
  const allPlayers = roster.characters.map((t) => t.player).flatMap((t) => t);
  return {
    characters: roster.characters.map((t) => ({
      name: t.name,
      class: t.class,
      role: t.role,
    })),
    players: allPlayers,
  };
}
