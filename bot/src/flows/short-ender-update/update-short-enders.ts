import { Character } from "../../classic-wow/raid-assignment";
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
  extraShortEnders: Character[],
): Promise<void> {
  const characterMetadataTable = new CharacterMetadataConfigTable(
    sheetClient,
    CONFIG.GUILD.INFO_SHEET,
  );
  const characterMetadata = await characterMetadataTable.getAllValues();
  const extraShortEndCount = new Map<string, number>();
  extraShortEnders.forEach((next) => {
    const existing = extraShortEndCount.get(next.name) ?? 0;

    extraShortEndCount.set(next.name, existing + 1);
  }, new Map<string, number>());

  const shortEnders = new Map(
    getShortEndersOfRaid(roster).map((t) => [t.name, 1]),
  );

  // Add extra short enders
  [...extraShortEndCount].forEach(([name, count]) => {
    const existing = shortEnders.get(name) ?? 0;

    shortEnders.set(name, existing + count);
  });

  const existingShortEnders: CharacterMetadata[] = characterMetadata
    .filter((t) => shortEnders.has(t.characterName))
    .map((t) => ({
      ...t,
      shortEndCount: t.shortEndCount + (shortEnders.get(t.characterName) ?? 0),
    }));
  const newShortEnders: CharacterMetadata[] = [...shortEnders]
    .filter(
      ([name]) => !existingShortEnders.find((x) => x.characterName === name),
    )
    .map(([name, count]) => ({
      characterName: name,
      shortEndCount: 1,
      tierThreeSetBonusStatus: count,
    }));

  const allShortEndersToUpsert = [...existingShortEnders, ...newShortEnders];

  // Go one at a time to not risk too many requests
  for (const curr of allShortEndersToUpsert) {
    await characterMetadataTable.upsertValue(curr);
  }
}
