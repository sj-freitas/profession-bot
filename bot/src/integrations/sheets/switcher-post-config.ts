import { SheetClient } from "./config";
import { SheetTableConfig, TableWrapper } from "./table-wrapper";

export interface WorldBuffPostConfig {
  serverId: string;
  messageId: string;
  channelId: string;
}

const config: SheetTableConfig<WorldBuffPostConfig> = {
  tableRange: "F2:H",
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

export class SwitcherRoleConfigTable extends TableWrapper<WorldBuffPostConfig> {
  constructor(sheetClient: SheetClient, sheetId: string) {
    super(sheetClient, sheetId, "Switchers", config);
  }
}
