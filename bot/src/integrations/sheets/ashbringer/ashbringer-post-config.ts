import { SheetClient } from "../config";
import { SheetTableConfig, TableWrapper } from "../table-wrapper";

export interface AshbringerPostConfig {
  serverId: string;
  announcementMessageId: string;
  channelId: string;
  postMessageId: string;
}

const config: SheetTableConfig<AshbringerPostConfig> = {
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

export class AshbringerPostConfigTable extends TableWrapper<AshbringerPostConfig> {
  constructor(sheetClient: SheetClient, sheetId: string) {
    super(sheetClient, sheetId, "Ashbringer", config);
  }
}
