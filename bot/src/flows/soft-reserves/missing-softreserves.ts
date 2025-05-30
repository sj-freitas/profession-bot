import { RaidEvent } from "../../integrations/raid-helper/types";
import { SheetClient } from "../../integrations/sheets/config";
import { PlayerInfo } from "../../integrations/sheets/player-info-table";
import { RaidInfoTable } from "../../integrations/sheets/raid-info";
import { getRaid } from "../../integrations/softres/softres-client";
import { filterTwo } from "../../lib/array-utils";
import { CharacterWithMetadata, Roster } from "../roster-helper";

function getCharacterThatSoftReserved(
  player: PlayerInfo,
  softReservedCharacters: string[],
): string | undefined {
  return [player.mainName, ...player.altNames].find(
    (t) => softReservedCharacters.indexOf(t) >= 0,
  );
}

function hasPlayerSoftReserved(
  player: PlayerInfo,
  softReservedCharacters: string[],
): boolean {
  return Boolean(getCharacterThatSoftReserved(player, softReservedCharacters));
}

export interface SelectedCharacterOfPlayer {
  player: PlayerInfo;
  selectedCharacter: string;
}

export interface InstanceRoster {
  instanceName: string;
  softresId: string;
  characters: SelectedCharacterOfPlayer[];
}

export interface SoftReserveInformation {
  instanceRoster: InstanceRoster;
  missingPlayers: PlayerInfo[];
}

function getRosterForDungeon(
  instanceName: string,
  softresId: string,
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
    softresId,
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
  allPlayersOfRaid: Roster,
): Promise<SoftReserveInformation[]> {
  const raidInfoTable = new RaidInfoTable(sheetClient, infoSheet);
  const raidInfoEntity = await raidInfoTable.getValueById(raidEvent.id);

  if (raidInfoEntity === null) {
    return [];
  }

  const softResIds = raidInfoEntity.softresIds;
  const softReservesInformation: SoftReserveInformation[] = (
    await Promise.all(
      softResIds.map(async (currId) => {
        const softReserveRaidInstance = await getRaid(currId);
        if (softReserveRaidInstance === null) {
          return null;
        }
        const charactersThatReserved = softReserveRaidInstance.reserved.map(
          (t) => t.name,
        );

        // Now find who's missing
        const [presentPlayers, missingPlayers] = filterTwo(
          allPlayersOfRaid.characters,
          (t) => hasPlayerSoftReserved(t.player, charactersThatReserved),
        );
        // TODO: Check late as well...
        const instanceRoster = getRosterForDungeon(
          softReserveRaidInstance.instances[0],
          softReserveRaidInstance.raidId,
          presentPlayers,
          charactersThatReserved,
        );

        return {
          instanceRoster,
          missingPlayers: missingPlayers.map((t) => t.player),
        };
      }),
    )
  ).filter((t): t is SoftReserveInformation => {
    return t !== null;
  });

  return softReservesInformation;
}
