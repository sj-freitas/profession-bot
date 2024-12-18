import { AvailableProfession, GuildProfessionData } from "./types";

interface RecipeInfo {
  crafter: string;
  recipe: string;
  wowHeadId: number;
  url: string;
  profession: string;
}

export interface Database {
  professionPivot: Map<string, RecipeInfo[]>;
}

export function loadDatabase(
  parseData: Map<AvailableProfession, GuildProfessionData>,
): Database {
  const professions = [...parseData.entries()];
  const professionPivot = new Map(
    professions.map(([profName, { recipes }]) => [
      profName,
      recipes
        .map((currRecipe) =>
          currRecipe.crafters.map((currCrafter) => ({
            crafter: currCrafter,
            recipe: currRecipe.name,
            wowHeadId: currRecipe.id,
            url: currRecipe.url,
            profession: profName,
          })),
        )
        .flatMap((t) => t),
    ]),
  );

  return {
    professionPivot,
  };
}

function canContain(lowerCasedSearchTerm: string, object: any): boolean {
  return Boolean(
    Object.values(object)
      .map((t) => `${t}`.toLocaleLowerCase())
      .find((t) => t.indexOf(lowerCasedSearchTerm) >= 0),
  );
}

export function searchDatabase(
  database: Database,
  searchTerm: string,
): RecipeInfo[] {
  // Can do with some magic here to make some words more similar to others and resolve
  // typos
  const flatResults = [...database.professionPivot.values()].flatMap((t) => t);
  const lowerCasedSearchTerm = searchTerm.toLocaleLowerCase();

  return flatResults.filter((t) => canContain(lowerCasedSearchTerm, t));
}
