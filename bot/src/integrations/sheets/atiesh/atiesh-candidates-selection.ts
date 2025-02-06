import { SheetClient } from "../config";
import { SheetTableConfig, TableWrapper } from "../table-wrapper";
import { parseIntOrDefault } from "../table-wrapper-utils";

export interface AtieshCandidateSelection {
  number: number;
  name: string;
  reason: string;
}

const config: SheetTableConfig<AtieshCandidateSelection> = {
  tableRange: "I2:K",
  idColumnName: "number",
  mapRawToEntity: ([number, name, reason]) => ({
    number: parseIntOrDefault(number, 1),
    name,
    reason,
  }),
  mapEntityToRaw: ({ number, name, reason }) => [`${number}`, name, reason],
};

export class AtieshCandidateSelectionTable extends TableWrapper<AtieshCandidateSelection> {
  constructor(sheetClient: SheetClient, sheetId: string) {
    super(sheetClient, sheetId, "Atiesh", config);
  }
}
