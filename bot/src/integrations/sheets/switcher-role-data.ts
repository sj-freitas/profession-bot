import { SheetClient } from "./config";
import { SheetTableConfig, TableWrapper } from "./table-wrapper";

export interface Switcher {
  characterName: string;
  switcherRole: string;
  originalRole: string;
  isMainBackup: boolean;
}

const config: SheetTableConfig<Switcher> = {
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

export class SwitcherRoleDataTable extends TableWrapper<Switcher> {
  constructor(sheetClient: SheetClient, sheetId: string) {
    super(sheetClient, sheetId, "Switchers", config);
  }
}
