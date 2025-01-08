import { SheetClient } from "./config";
import { SheetTableConfig, TableWrapper } from "./table-wrapper";
import { toColumnValue, toEntityValue } from "./table-wrapper-utilts";

export interface SoftresRaidData {
  softresId: string;
  raidNameMatchingTerms: string[];
  raidName: string;
  useSoftRes: boolean;
  useWbItems: boolean;
}

const config: SheetTableConfig<SoftresRaidData> = {
  tableRange: "A2:E",
  idColumnName: "softresId",
  mapRawToEntity: ([
    softresId,
    raidNameMatchingTerms,
    raidName,
    useSoftRes,
    useWbItems,
  ]) => ({
    softresId,
    raidNameMatchingTerms: toEntityValue(raidNameMatchingTerms),
    raidName,
    useSoftRes: useSoftRes === "TRUE",
    useWbItems: useWbItems === "TRUE",
  }),
  mapEntityToRaw: ({
    softresId,
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

export class SoftresRaidDataTable extends TableWrapper<SoftresRaidData> {
  constructor(sheetClient: SheetClient, sheetId: string) {
    super(sheetClient, sheetId, "RaidConfig", config);
  }
}
