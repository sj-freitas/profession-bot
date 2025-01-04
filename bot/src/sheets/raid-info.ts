import { SheetClient } from "./config";
import { SheetTableConfig, TableWrapper } from "./table-wrapper";

export interface RaidInfo {
  eventId: string;
  serverId: string;
  channelId: string;
  softresId: string;
  softresToken: string;
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
    softresId,
    softresToken,
    rosterHash,
    lastUpdated,
  ]) => ({
    eventId,
    serverId,
    channelId,
    softresId,
    softresToken,
    rosterHash,
    lastUpdated,
  }),
  mapEntityToRaw: ({
    eventId,
    serverId,
    channelId,
    softresId,
    softresToken,
    rosterHash,
    lastUpdated,
  }) => [
    eventId,
    serverId,
    channelId,
    softresId,
    softresToken,
    rosterHash,
    lastUpdated,
  ],
};

export class RaidInfoTable extends TableWrapper<RaidInfo> {
  constructor(sheetClient: SheetClient, sheetId: string) {
    super(sheetClient, sheetId, "Raids", config);
  }
}
