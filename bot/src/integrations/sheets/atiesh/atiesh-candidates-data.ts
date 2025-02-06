import { SheetClient } from "../config";
import { SheetTableConfig, TableWrapper } from "../table-wrapper";

export interface AtieshCandidate {
  characterName: string;
  characterClass: string;
}

const config: SheetTableConfig<AtieshCandidate> = {
  tableRange: "A2:B",
  idColumnName: "characterName",
  mapRawToEntity: ([characterName, characterClass]) => ({
    characterName,
    characterClass,
  }),
  mapEntityToRaw: ({ characterName, characterClass }) => [
    characterName,
    characterClass,
  ],
};

export class AtieshCandidatesTable extends TableWrapper<AtieshCandidate> {
  constructor(sheetClient: SheetClient, sheetId: string) {
    super(sheetClient, sheetId, "Atiesh", config);
  }
}
