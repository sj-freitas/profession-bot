export interface WowHeadResult {
  type: number;
  id: number;
  name: string;
  typeName: string; // Spell (?)
  popularity: number;
  icon: string;
}

export interface WowHeadQueryResults {
  search: string;
  results: WowHeadResult[];
}
