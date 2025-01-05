import { Player } from "../../integrations/sheets/get-players";
import { Character } from "../raid-assignment";

export interface RaidAssignmentRoster {
  characters: Character[];
  players: Player[];
}
