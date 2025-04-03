import { SheetClient } from "../config";
import { SheetTableConfig, TableWrapper } from "../table-wrapper";

type AshbringerStatus =
  | "InProgress"
  | "Completed"
  | "PotentialCandidate"
  | "NotAnnounced"
  | "OnTheList"
  | "Unknown";

export interface AshbringerCandidate {
  characterName: string;
  characterClass: string;
  ashbringerStatus: AshbringerStatus;
}

function parseAshbringerStatus(rawStatus: string): AshbringerStatus {
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

const config: SheetTableConfig<AshbringerCandidate> = {
  tableRange: "A2:C",
  idColumnName: "characterName",
  mapRawToEntity: ([characterName, characterClass, ashbringerStatus]) => ({
    characterName,
    characterClass,
    ashbringerStatus: parseAshbringerStatus(ashbringerStatus),
  }),
  mapEntityToRaw: ({ characterName, characterClass, ashbringerStatus }) => [
    characterName,
    characterClass,
    ashbringerStatus,
  ],
};

export class AshbringerCandidatesTable extends TableWrapper<AshbringerCandidate> {
  constructor(sheetClient: SheetClient, sheetId: string) {
    super(sheetClient, sheetId, "Ashbringer", config);
  }
}
