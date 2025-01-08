/* eslint-disable no-console */
import { createHash } from "crypto";
import {
  Character,
  MAX_GROUP_SIZE,
  MAX_RAID_GROUP_AMOUNT,
} from "../classic-wow/raid-assignment";
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
import { Switcher } from "../integrations/sheets/switcher-role-data";

const tankNumberBasedOnRosterSize = [0, 1, 2, 2, 2, 3, 3, 3, 3];
const healerNumberBasedOnRosterSize = [0, 1, 2, 2, 3, 3, 3, 4, 4];

function getMinNumberOfTanksBasedOnRosterSize(rosterCount: number): number {
  const groupCount = Math.min(
    Math.ceil(rosterCount / MAX_GROUP_SIZE),
    MAX_RAID_GROUP_AMOUNT,
  );

  return tankNumberBasedOnRosterSize[groupCount];
}

function getMinNumberOfHealersBasedOnRosterSize(rosterCount: number): number {
  const groupCount = Math.min(
    Math.ceil(rosterCount / MAX_GROUP_SIZE),
    MAX_RAID_GROUP_AMOUNT,
  );

  return healerNumberBasedOnRosterSize[groupCount];
}

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

function sortByPreference(switchers: Switcher[]) {
  return switchers.sort(
    (a, b) => (a.isMainBackup ? 0 : 1) - (b.isMainBackup ? 0 : 1),
  );
}

export function calibrateRoster(roster: Roster, database: Database): Roster {
  const allSwitchers = database.getSwitchers();
  const switchersInRaids = allSwitchers.filter((t) =>
    roster.characters.find(
      // Make sure that the switchers are playing their normal spec
      // Otherwise we might get duplicates
      (x) => x.name === t.characterName && x.role !== t.switcherRole,
    ),
  );
  const groupedByRole = switchersInRaids.reduce((map, next) => {
    map.set(
      next.switcherRole,
      sortByPreference([...(map.get(next.switcherRole) ?? []), next]),
    );
    return map;
  }, new Map<string, Switcher[]>());
  const switchersByRoleMap = new Map(
    [...groupedByRole.entries()].map(([key, values]) => [
      key,
      values
        .map((t) => {
          const foundCharacter = roster.characters.find(
            (x) => x.name === t.characterName,
          );
          if (!foundCharacter) {
            return null;
          }

          return {
            ...foundCharacter,
            role: key,
          };
        })
        .filter((t): t is CharacterWithMetadata => t !== null),
    ]),
  );

  const tanks = roster.characters.filter((t) => t.role === "Tank");
  const amountOfMissingTanks =
    getMinNumberOfTanksBasedOnRosterSize(roster.characters.length) -
    tanks.length;
  if (amountOfMissingTanks > 0) {
    // Get more tanks!
    const tankSwitchers = switchersByRoleMap.get("Tank") ?? [];
    const playersToSwitch = tankSwitchers.slice(0, amountOfMissingTanks);

    tanks.push(...playersToSwitch);
  }

  const healers = roster.characters.filter((t) => t.role === "Healer");
  const amountOfMissingHealers =
    getMinNumberOfHealersBasedOnRosterSize(roster.characters.length) -
    healers.length;
  if (amountOfMissingHealers > 0) {
    // Get more tanks!
    const healerSwitchers = switchersByRoleMap.get("Healer") ?? [];
    const playersToSwitch = healerSwitchers.slice(0, amountOfMissingHealers);

    healers.push(...playersToSwitch);
  }

  // Tanks and Healers should be sorted now... Add the rest but remove the switchers
  const healersAndTanks = [...healers, ...tanks];
  const remainingRoster = roster.characters.filter(
    (t) => !healersAndTanks.find((x) => x.name === t.name),
  );

  return {
    ...roster,
    characters: [...healersAndTanks, ...remainingRoster],
  };
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
  type SignUpWithPlayer = SimplifiedSignUp & { player: Player };

  const hash = createSignUpsHash(signUps);
  const allPlayers = database.getPlayersRoster();
  const playerMap = new Map(allPlayers.map((t) => [t.discordId, t]));
  const matchedPlayers = signUps
    .map(
      (t) =>
        ({
          ...t,
          player: playerMap.get(t.userId!),
        }) as SignUpWithPlayer,
    )
    .filter((t): t is SignUpWithPlayer => {
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

  return calibrateRoster(
    {
      rosterHash: hash,
      characters,
    },
    database,
  );
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
