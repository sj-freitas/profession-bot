import { SheetClient } from "../config";
import { SheetTableConfig, TableWrapper } from "../table-wrapper";

type AtieshStatus =
  | "InProgress"
  | "Completed"
  | "PotentialCandidate"
  | "NotAnnounced"
  | "OnTheList"
  | "Unknown";

export interface AtieshCandidate {
  characterName: string;
  characterClass: string;
  atieshStatus: AtieshStatus;
}

function parseAtieshStatus(rawStatus: string): AtieshStatus {
  switch (rawStatus) {
    case "InProgress": {
      return "InProgress";
    }
    case "Completed": {
      return "Completed";
    }
    case "PotentialCandidate": {
      return "PotentialCandidate";
    }
    case "NotAnnounced": {
      return "NotAnnounced";
    }
    case "OnTheList": {
      return "OnTheList";
    }
    case "Unknown":
    default: {
      return "Unknown";
    }
  }
}

const config: SheetTableConfig<AtieshCandidate> = {
  tableRange: "A2:C",
  idColumnName: "characterName",
  mapRawToEntity: ([characterName, characterClass, atieshStatus]) => ({
    characterName,
    characterClass,
    atieshStatus: parseAtieshStatus(atieshStatus),
  }),
  mapEntityToRaw: ({ characterName, characterClass, atieshStatus }) => [
    characterName,
    characterClass,
    atieshStatus,
  ],
};

export class AtieshCandidatesTable extends TableWrapper<AtieshCandidate> {
  constructor(sheetClient: SheetClient, sheetId: string) {
    super(sheetClient, sheetId, "Atiesh", config);
  }
}
