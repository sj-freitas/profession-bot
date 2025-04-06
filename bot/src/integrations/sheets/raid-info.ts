import { SheetClient } from "./config";
import { SheetTableConfig, TableWrapper } from "./table-wrapper";
import { toColumnValue, toEntityValue } from "./table-wrapper-utils";

function isValidateDate(dateString: unknown): boolean {
  if (!dateString) {
    return false;
  }
  if (typeof dateString !== "string") {
    return false;
  }

  return !Number.isNaN(new Date(dateString).getTime());
}

export interface RaidInfo {
  eventId: string;
  serverId: string;
  channelId: string;
  softresIds: string[];
  softresTokens: string[];
  rosterHash: string;
  lastUpdated: Date;
  assignmentsLocked?: Date;
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
    assignmentsLocked,
  ]) => ({
    eventId,
    serverId,
    channelId,
    softresIds: toEntityValue(softresIds),
    softresTokens: toEntityValue(softresTokens),
    rosterHash,
    lastUpdated: new Date(lastUpdated),
    assignmentsLocked: isValidateDate(assignmentsLocked)
      ? new Date(assignmentsLocked)
      : undefined,
  }),
  mapEntityToRaw: ({
    eventId,
    serverId,
    channelId,
    softresIds,
    softresTokens,
    rosterHash,
    lastUpdated,
    assignmentsLocked,
  }) => [
    eventId,
    serverId,
    channelId,
    toColumnValue(softresIds),
    toColumnValue(softresTokens),
    rosterHash,
    lastUpdated.toString(),
    assignmentsLocked ? assignmentsLocked.toString() : "",
  ],
};

export class RaidInfoTable extends TableWrapper<RaidInfo> {
  constructor(sheetClient: SheetClient, sheetId: string) {
    super(sheetClient, sheetId, "Raids", config);
  }
}
