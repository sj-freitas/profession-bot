import { SheetClient } from "./config";
import { SheetTableConfig, TableWrapper } from "./table-wrapper";

export interface SoftresRaidData {
  characterName: string;
  switcherRole: string;
  originalRole: string;
  isMainBackup: boolean;
}

const config: SheetTableConfig<SoftresRaidData> = {
  tableRange: "A2:D",
  idColumnName: "characterName",
  mapRawToEntity: ([
    characterName,
    switcherRole,
    originalRole,
    isMainBackup,
  ]) => ({
    characterName,
    switcherRole,
    originalRole,
    isMainBackup: isMainBackup === "TRUE",
  }),
  mapEntityToRaw: ({
    characterName,
    switcherRole,
    originalRole,
    isMainBackup,
  }) => [
    characterName,
    switcherRole,
    originalRole,
    isMainBackup ? "TRUE" : "FALSE",
  ],
};

export class SwitcherRoleDataTable extends TableWrapper<SoftresRaidData> {
  constructor(sheetClient: SheetClient, sheetId: string) {
    super(sheetClient, sheetId, "Switchers", config);
  }
}
