import { SheetClient } from "../config";
import { SheetTableConfig, TableWrapper } from "../table-wrapper";

export interface AtieshPostConfig {
  serverId: string;
  announcementMessageId: string;
  channelId: string;
  postMessageId: string;
}

const config: SheetTableConfig<AtieshPostConfig> = {
  tableRange: "D2:G",
  idColumnName: "serverId",
  mapRawToEntity: ([
    serverId,
    announcementMessageId,
    channelId,
    postMessageId,
  ]) => ({
    serverId,
    announcementMessageId,
    channelId,
    postMessageId,
  }),
  mapEntityToRaw: ({
    serverId,
    announcementMessageId,
    channelId,
    postMessageId,
  }) => [serverId, announcementMessageId, channelId, postMessageId],
};

export class AtieshPostConfigTable extends TableWrapper<AtieshPostConfig> {
  constructor(sheetClient: SheetClient, sheetId: string) {
    super(sheetClient, sheetId, "Atiesh", config);
  }
}
