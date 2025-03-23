import { SheetClient } from "./config";
import { SheetTableConfig, TableWrapper } from "./table-wrapper";

export interface CharacterMetadataUpdate {
  id: string;
  lastUpdatedRaidId: string;
  lastUpdate: Date;
}

const config: SheetTableConfig<CharacterMetadataUpdate> = {
  tableRange: "M2:O",
  idColumnName: "id",
  mapRawToEntity: ([id, lastUpdatedRaidId, lastUpdate]) => ({
    id,
    lastUpdatedRaidId,
    lastUpdate: new Date(Date.parse(lastUpdate)),
  }),
  mapEntityToRaw: ({ id, lastUpdatedRaidId, lastUpdate }) => [
    id,
    lastUpdatedRaidId,
    lastUpdate.toDateString(),
  ],
};

export class CharacterMetadataUpdateConfigTable extends TableWrapper<CharacterMetadataUpdate> {
  constructor(sheetClient: SheetClient, sheetId: string) {
    super(sheetClient, sheetId, "CharacterMetadata", config);
  }
}
