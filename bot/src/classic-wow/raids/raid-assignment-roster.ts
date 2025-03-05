import { PlayerInfo } from "../../integrations/sheets/player-info-table";
import { Character } from "../raid-assignment";

export interface RaidAssignmentRoster {
  characters: Character[];
  players: PlayerInfo[];
}
