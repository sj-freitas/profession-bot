import { SheetClient } from "../config";
import { SheetTableConfig, TableWrapper } from "../table-wrapper";
import { parseIntOrDefault } from "../table-wrapper-utils";

export interface AshbringerCandidateSelection {
  number: number;
  name: string;
  reason: string;
}

const config: SheetTableConfig<AshbringerCandidateSelection> = {
  tableRange: "I2:K",
  idColumnName: "number",
  mapRawToEntity: ([number, name, reason]) => ({
    number: parseIntOrDefault(number, 1),
    name,
    reason,
  }),
  mapEntityToRaw: ({ number, name, reason }) => [`${number}`, name, reason],
};

export class AshbringerCandidateSelectionTable extends TableWrapper<AshbringerCandidateSelection> {
  constructor(sheetClient: SheetClient, sheetId: string) {
    super(sheetClient, sheetId, "Ashbringer", config);
  }
}
