import { SheetClient } from "./config";
import { SheetTableConfig, TableWrapper } from "./table-wrapper";
import { toColumnValue, toEntityValue } from "./table-wrapper-utilts";

export interface SoftresRaidData {
  softresId: string;
  raidNameMatchingTerms: string[];
  raidName: string;
  useSoftRes: string;
}

const config: SheetTableConfig<SoftresRaidData> = {
  tableRange: "E2:H",
  idColumnName: "softresId",
  mapRawToEntity: ([
    softresId,
    raidNameMatchingTerms,
    raidName,
    useSoftRes,
  ]) => ({
    softresId,
    raidNameMatchingTerms: toEntityValue(raidNameMatchingTerms),
    raidName,
    useSoftRes,
  }),
  mapEntityToRaw: ({
    softresId,
    raidNameMatchingTerms,
    raidName,
    useSoftRes,
  }) => [softresId, toColumnValue(raidNameMatchingTerms), raidName, useSoftRes],
};

export class SoftresRaidDataTable extends TableWrapper<SoftresRaidData> {
  constructor(sheetClient: SheetClient, sheetId: string) {
    super(sheetClient, sheetId, "DiscordMapping", config);
  }
}
