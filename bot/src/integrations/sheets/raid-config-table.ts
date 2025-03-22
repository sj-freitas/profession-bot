import { SheetClient } from "./config";
import { SheetTableConfig, TableWrapper } from "./table-wrapper";
import {
  parseIntOrDefault,
  toColumnValue,
  toEntityValue,
} from "./table-wrapper-utils";

const DEFAULT_SOFTRES_AMOUNT = 2;

export interface RaidConfig {
  raidId: string; // Matches with the softres instance name
  raidNameMatchingTerms: string[];
  raidName: string;
  useSoftRes: boolean;
  useWbItems: boolean;
  softresAmount: number;
  allowDuplicates: boolean;
  usePointSystem: boolean;
}

const config: SheetTableConfig<RaidConfig> = {
  tableRange: "A2:H",
  idColumnName: "raidId",
  mapRawToEntity: ([
    softresId,
    raidNameMatchingTerms,
    raidName,
    useSoftRes,
    useWbItems,
    softresAmount,
    allowDuplicates,
    usePointSystem,
  ]) => ({
    raidId: softresId,
    raidNameMatchingTerms: toEntityValue(raidNameMatchingTerms),
    raidName,
    useSoftRes: useSoftRes === "TRUE",
    useWbItems: useWbItems === "TRUE",
    softresAmount: parseIntOrDefault(softresAmount, DEFAULT_SOFTRES_AMOUNT),
    allowDuplicates: allowDuplicates === "TRUE",
    usePointSystem: usePointSystem === "TRUE",
  }),
  mapEntityToRaw: ({
    raidId: softresId,
    raidNameMatchingTerms,
    raidName,
    useSoftRes,
    useWbItems,
    softresAmount,
    allowDuplicates,
    usePointSystem,
  }) => [
    softresId,
    toColumnValue(raidNameMatchingTerms),
    raidName,
    useSoftRes ? "TRUE" : "FALSE",
    useWbItems ? "TRUE" : "FALSE",
    `${softresAmount}`,
    allowDuplicates ? "TRUE" : "FALSE",
    usePointSystem ? "TRUE" : "FALSE",
  ],
};

export class RaidConfigTable extends TableWrapper<RaidConfig> {
  constructor(sheetClient: SheetClient, sheetId: string) {
    super(sheetClient, sheetId, "RaidConfig", config);
  }
}
