import { getShortEndersOfRaid } from "../../classic-wow/raids/generic";
import { RaidAssignmentRoster } from "../../classic-wow/raids/raid-assignment-roster";
import { CONFIG } from "../../config";
import {
  CharacterMetadata,
  CharacterMetadataConfigTable,
} from "../../integrations/sheets/character-metadata.config";
import { SheetClient } from "../../integrations/sheets/config";

export async function updateShortEnders(
  sheetClient: SheetClient,
  roster: RaidAssignmentRoster,
): Promise<void> {
  const characterMetadataTable = new CharacterMetadataConfigTable(
    sheetClient,
    CONFIG.GUILD.INFO_SHEET,
  );
  const characterMetadata = await characterMetadataTable.getAllValues();

  const shortEnders = new Set(getShortEndersOfRaid(roster).map((t) => t.name));
  const existingShortEnders: CharacterMetadata[] = characterMetadata
    .filter((t) => shortEnders.has(t.characterName))
    .map((t) => ({
      ...t,
      shortEndCount: t.shortEndCount + 1,
    }));
  const newShortEnders: CharacterMetadata[] = [...shortEnders]
    .filter((t) => !existingShortEnders.find((x) => x.characterName === t))
    .map((t) => ({
      characterName: t,
      shortEndCount: 1,
      tierThreeSetBonusStatus: 1,
    }));

  const allShortEndersToUpsert = [...existingShortEnders, ...newShortEnders];

  for (const curr of allShortEndersToUpsert) {
    await characterMetadataTable.upsertValue(curr);
  }
}
