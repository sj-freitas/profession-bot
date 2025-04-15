export type AvailableProfession =
  | "Enchanting"
  | "Blacksmithing"
  | "Miner"
  | "Leatherworker"
  | "Skinner"
  | "Tailoring"
  | "Alchemy"
  | "Herbalism"
  | "Engineering"
  | "Cooking";

const CRAFTING_PROFESSIONS: Set<AvailableProfession> = new Set([
  "Enchanting",
  "Blacksmithing",
  "Leatherworker",
  "Tailoring",
  "Alchemy",
  "Engineering",
  "Miner",
  "Cooking"
]);

export interface PlayerProfessionsData {
  characterName: string;
  professions: {
    name: AvailableProfession;
    recipes: string[];
  }[];
}

export interface GuildProfessionData {
  recipes: {
    name: string;
    url: string;
    id: number;
    crafters: string[];
  }[];
}

export type RecipesOfGuild = {
  [profession in AvailableProfession]: GuildProfessionData[];
};

export function filterByCraftingProfessions(
  players: PlayerProfessionsData[],
): PlayerProfessionsData[] {
  return players
    .map(({ professions, ...playerData }) => ({
      ...playerData,
      professions: professions.filter((currProf) =>
        CRAFTING_PROFESSIONS.has(currProf.name),
      ),
    }))
    .filter((t) => t.professions.length > 0);
}
