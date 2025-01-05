import { SheetClient } from "./config";
import { SheetTableConfig, TableWrapper } from "./table-wrapper";
import { toColumnValue, toEntityValue } from "./table-wrapper-utilts";

export interface RaidInfo {
  eventId: string;
  serverId: string;
  channelId: string;
  softresIds: string[];
  softresTokens: string[];
  rosterHash: string;
  lastUpdated: string;
}

const config: SheetTableConfig<RaidInfo> = {
  tableRange: "A2:F",
  idColumnName: "eventId",
  mapRawToEntity: ([
    eventId,
    serverId,
    channelId,
    softresIds,
    softresTokens,
    rosterHash,
    lastUpdated,
  ]) => ({
    eventId,
    serverId,
    channelId,
    softresIds: toEntityValue(softresIds),
    softresTokens: toEntityValue(softresTokens),
    rosterHash,
    lastUpdated,
  }),
  mapEntityToRaw: ({
    eventId,
    serverId,
    channelId,
    softresIds,
    softresTokens,
    rosterHash,
    lastUpdated,
  }) => [
    eventId,
    serverId,
    channelId,
    toColumnValue(softresIds),
    toColumnValue(softresTokens),
    rosterHash,
    lastUpdated,
  ],
};

export class RaidInfoTable extends TableWrapper<RaidInfo> {
  constructor(sheetClient: SheetClient, sheetId: string) {
    super(sheetClient, sheetId, "Raids", config);
  }
}
