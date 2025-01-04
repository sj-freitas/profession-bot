import { RaidEvent } from "../../integrations/raid-helper/types";
import { SheetClient } from "../../integrations/sheets/config";
import { Player } from "../../integrations/sheets/get-players";
import { RaidInfoTable } from "../../integrations/sheets/raid-info";
import { getRaid } from "../../integrations/softres/softres-client";
import { filterTwo } from "../../lib/array-utilts";
import {
  CharacterWithMetadata,
  getRosterFromRaidEvent,
} from "../roster-helper";

function getCharacterThatSoftReserved(
  player: Player,
  softReservedCharacters: string[],
): string | undefined {
  return player.characters.find((t) => softReservedCharacters.indexOf(t) >= 0);
}

function hasPlayerSoftReserved(
  player: Player,
  softReservedCharacters: string[],
): boolean {
  return Boolean(getCharacterThatSoftReserved(player, softReservedCharacters));
}

export interface SelectedCharacterOfPlayer {
  player: Player;
  selectedCharacter: string;
}

export interface InstanceRoster {
  instanceName: string;
  characters: SelectedCharacterOfPlayer[];
}

export interface SoftReserveInformation {
  instanceRoster: InstanceRoster;
  missingPlayers: Player[];
}

function getRosterForDungeon(
  instanceName: string,
  presentPlayers: CharacterWithMetadata[],
  charactersThatReserved: string[],
): InstanceRoster {
  const characters = presentPlayers
    .map((t) => ({
      player: t.player,
      selectedCharacter: getCharacterThatSoftReserved(
        t.player,
        charactersThatReserved,
      ),
    }))
    .filter((t): t is SelectedCharacterOfPlayer =>
      Boolean(t.selectedCharacter),
    );

  return {
    instanceName,
    characters,
  };
}

// Experimental function
export function findRepeatedPlayers(
  softReserveInformation: SoftReserveInformation,
): SelectedCharacterOfPlayer[] {
  const countPerPlayer =
    softReserveInformation.instanceRoster.characters.reduce((res, t) => {
      res[t.player.discordId] = (res[t.player.discordId] ?? 0) + 1;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return res;
    }, {} as any);

  const idsWithMoreThanOneChar = Object.entries(countPerPlayer)
    .filter(([, count]) => (count as number) > 1)
    .map(([id]) => id);

  return softReserveInformation.instanceRoster.characters.filter(
    (t) => idsWithMoreThanOneChar.indexOf(t.player.discordId) >= 0,
  );
}

export async function getSoftReserveInformation(
  raidEvent: RaidEvent,
  sheetClient: SheetClient,
  infoSheet: string,
): Promise<SoftReserveInformation[]> {
  const raidInfoTable = new RaidInfoTable(sheetClient, infoSheet);
  const raidInfoEntity = await raidInfoTable.getValueById(raidEvent.id);
  const allPlayersOfRaid = await getRosterFromRaidEvent(raidEvent);

  if (raidInfoEntity === null) {
    return [];
  }

  const softResIds = raidInfoEntity.softresId.split(";");
  const softReservesInformation: SoftReserveInformation[] = await Promise.all(
    softResIds.map(async (currId) => {
      const softReserveRaidInstance = await getRaid(currId);
      const charactersThatReserved = softReserveRaidInstance.reserved.map(
        (t) => t.name,
      );

      // Now find who's missing
      const [presentPlayers, missingPlayers] = filterTwo(
        allPlayersOfRaid.characters,
        (t) => hasPlayerSoftReserved(t.player, charactersThatReserved),
      );
      const instanceRoster = getRosterForDungeon(
        softReserveRaidInstance.instances[0],
        presentPlayers,
        charactersThatReserved,
      );

      return {
        instanceRoster,
        missingPlayers: missingPlayers.map((t) => t.player),
      };
    }),
  );

  return softReservesInformation;
}
