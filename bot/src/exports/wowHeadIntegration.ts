/* eslint-disable no-console */
import { CONFIG } from "../config";
import { queryWowHead } from "../integrations/wowhead/client";
import {
  removeNonSpells,
  removeQAResults,
} from "../integrations/wowhead/helpers";
import {
  AvailableProfession,
  filterByCraftingProfessions,
  GuildProfessionData,
  PlayerProfessionsData,
} from "./types";

interface RecipeInfo {
  name: string;
  id: number;
}

function sanitizeQuery(query: string): string {
  return query.replaceAll("bracers", "bracer");
}

async function tryGetRecipeInfoFromWowHead(
  recipeName: string,
): Promise<RecipeInfo | null> {
  // Possible clean up here (?)
  const sanitizedQuery = sanitizeQuery(recipeName);
  const results = await queryWowHead(sanitizedQuery);
  const firstResult = removeNonSpells(removeQAResults(results)).results[0];

  if (!firstResult) {
    console.warn(`Unknown recipe ${recipeName} - clean up!`);
    return null;
  }

  return {
    name: firstResult.name,
    id: firstResult.id,
  };
}

export async function getGuildInfo(
  data: PlayerProfessionsData[],
): Promise<Map<AvailableProfession, GuildProfessionData>> {
  const flatData = await Promise.all(
    filterByCraftingProfessions(data).map(
      async (currCharacterInfo: PlayerProfessionsData) => {
        const { professions, characterName } = currCharacterInfo;

        const recipesOfProfession = await Promise.all(
          professions.map(async (currProf) => {
            const recipes = await Promise.all(
              currProf.recipes.map(tryGetRecipeInfoFromWowHead),
            );

            return recipes
              .filter((currRecipe) => currRecipe !== null)
              .map((currRecipe) => ({
                characterName,
                recipe: currRecipe,
                profession: currProf.name,
              }));
          }),
        );

        return recipesOfProfession.flat();
      },
    ),
  );

  const initialMap = new Map<AvailableProfession, GuildProfessionData>();

  return flatData.flat().reduce((res, currData) => {
    const existingProfession = res.get(currData.profession) ?? { recipes: [] };

    // Check if the recipe is already added.
    const existingRecipe = existingProfession.recipes.find(
      (t) => t.id === currData.recipe.id,
    ) ?? {
      name: currData.recipe.name,
      url: `${CONFIG.WOW_HEAD.HOST_NAME}/classic/spell=${currData.recipe.id}`,
      id: currData.recipe.id,
      crafters: [],
    };

    const editedProfession = {
      recipes: [
        ...existingProfession.recipes.filter(
          (t) => t.id !== currData.recipe.id,
        ),
        {
          ...existingRecipe,
          crafters: [...new Set([...existingRecipe.crafters, currData.characterName]).values()],
        },
      ],
    };

    res.set(currData.profession, editedProfession);

    return res;
  }, initialMap);
}
