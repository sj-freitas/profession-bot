import { SheetClient } from "./config";
import { SheetTableConfig, TableWrapper } from "./table-wrapper";
import { toColumnValue, toEntityValue } from "./table-wrapper-utilts";

export interface RaidConfig {
  raidId: string; // Matches with the softres instance name
  raidNameMatchingTerms: string[];
  raidName: string;
  useSoftRes: boolean;
  useWbItems: boolean;
}

const config: SheetTableConfig<RaidConfig> = {
  tableRange: "A2:E",
  idColumnName: "raidId",
  mapRawToEntity: ([
    softresId,
    raidNameMatchingTerms,
    raidName,
    useSoftRes,
    useWbItems,
  ]) => ({
    raidId: softresId,
    raidNameMatchingTerms: toEntityValue(raidNameMatchingTerms),
    raidName,
    useSoftRes: useSoftRes === "TRUE",
    useWbItems: useWbItems === "TRUE",
  }),
  mapEntityToRaw: ({
    raidId: softresId,
    raidNameMatchingTerms,
    raidName,
    useSoftRes,
    useWbItems,
  }) => [
    softresId,
    toColumnValue(raidNameMatchingTerms),
    raidName,
    useSoftRes ? "TRUE" : "FALSE",
    useWbItems ? "TRUE" : "FALSE",
  ],
};

export class RaidConfigTable extends TableWrapper<RaidConfig> {
  constructor(sheetClient: SheetClient, sheetId: string) {
    super(sheetClient, sheetId, "RaidConfig", config);
  }
}
