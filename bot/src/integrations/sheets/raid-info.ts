import { SheetClient } from "./config";
import { SheetTableConfig, TableWrapper } from "./table-wrapper";
import { toColumnValue, toEntityValue } from "./table-wrapper-utils";

export interface RaidInfo {
  eventId: string;
  serverId: string;
  channelId: string;
  softresIds: string[];
  softresTokens: string[];
  rosterHash: string;
  lastUpdated: Date;
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
    lastUpdated: new Date(lastUpdated),
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
    lastUpdated.toString(),
  ],
};

export class RaidInfoTable extends TableWrapper<RaidInfo> {
  constructor(sheetClient: SheetClient, sheetId: string) {
    super(sheetClient, sheetId, "Raids", config);
  }
}
