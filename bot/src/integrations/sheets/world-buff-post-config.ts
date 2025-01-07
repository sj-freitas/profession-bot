import { SheetClient } from "./config";
import { SheetTableConfig, TableWrapper } from "./table-wrapper";

export interface WorldBuffPostConfig {
  serverId: string;
  messageId: string;
  channelId: string;
}

const config: SheetTableConfig<WorldBuffPostConfig> = {
  tableRange: "D2:F",
  idColumnName: "serverId",
  mapRawToEntity: ([serverId, messageId, channelId]) => ({
    serverId,
    messageId,
    channelId,
  }),
  mapEntityToRaw: ({ serverId, messageId, channelId }) => [
    serverId,
    messageId,
    channelId,
  ],
};

export class WorldBuffPostConfigTable extends TableWrapper<WorldBuffPostConfig> {
  constructor(sheetClient: SheetClient, sheetId: string) {
    super(sheetClient, sheetId, "WBManagement", config);
  }
}
