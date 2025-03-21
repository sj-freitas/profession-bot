import { SheetClient } from "./config";
import { SheetTableConfig, TableWrapper } from "./table-wrapper";

export interface CharacterMetadata {
  characterName: string;
  shortEndCount: number;
  tierThreeSetBonusStatus: number;
}

const config: SheetTableConfig<CharacterMetadata> = {
  tableRange: "A2:C",
  idColumnName: "characterName",
  mapRawToEntity: ([
    characterName,
    shortEndCount,
    tierThreeSetBonusStatus,
  ]) => ({
    characterName,
    shortEndCount: Number.parseInt(shortEndCount, 10),
    tierThreeSetBonusStatus: Number.parseInt(tierThreeSetBonusStatus, 10),
  }),
  mapEntityToRaw: ({
    characterName,
    shortEndCount,
    tierThreeSetBonusStatus,
  }) => [characterName, `${shortEndCount}`, `${tierThreeSetBonusStatus}`],
};

export class CharacterMetadataConfigTable extends TableWrapper<CharacterMetadata> {
  constructor(sheetClient: SheetClient, sheetId: string) {
    super(sheetClient, sheetId, "CharacterMetadata", config);
  }
}
