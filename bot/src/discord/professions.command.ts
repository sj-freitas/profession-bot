/* eslint-disable no-console */
import { Database } from "../exports/mem-database";
import { queryWowHead } from "../integrations/wowhead/client";
import {
  removeNonSpells,
  removeQAResults,
} from "../integrations/wowhead/helpers";
import { CommandHandler } from "./commandHandler";

const MAX_ALLOWED_SEARCH_RESULTS = 4;

export const handleCrafter: CommandHandler<Database> = async ({
  options,
  reply,
  payload: database,
}): Promise<void> => {
  const recipe = options.getString("recipe");

  if (recipe === null) {
    await reply("Failed to provide a valid recipe, please try another one.");
    return;
  }

  // Analytics for here

  // Match with a similar name
  // Search the database
  type SimplifiedPlayer = {
    characterName: string;
    serverHandle: string;
  };
  const allPlayers = new Map(
    database
      .getPlayersRoster()
      .map((t) =>
        t.characters.map((x) => ({
          characterName: x,
          serverHandle: t.serverHandle,
        })),
      )
      .flatMap((t: SimplifiedPlayer[]) => t)
      .map((t) => [t.characterName, t]),
  );
  const wowHeadResults = await queryWowHead(recipe);
  const wowHeadFilteredResults = removeNonSpells(
    removeQAResults(wowHeadResults),
  ).results;
  const results = wowHeadFilteredResults
    .map((t) => database.queryRecipes(t.name))
    .flatMap((t) => t);

  if (results.length === 0) {
    await reply(
      `Could not find any results for ${recipe}, maybe there's a typo or we don't have crafters`,
    );
    return;
  }

  const uniqueRecipes = new Map(results.map((t) => [t.wowHeadId, t]));
  if (uniqueRecipes.size > MAX_ALLOWED_SEARCH_RESULTS) {
    await reply(
      `Found more than ${MAX_ALLOWED_SEARCH_RESULTS} matching recipes:\n${[...uniqueRecipes.values()].map((t) => t.recipe).join("\n")}\nYou can search for a specific one by copying it from above.`,
    );
    return;
  }

  // Return the multiple results
  // Group by same recipe
  type CraftingResult = {
    wowHeadId: number;
    url: string;
    name: string;
    crafters: SimplifiedPlayer[];
  };

  const groupedRecipes: CraftingResult[] = [...uniqueRecipes.values()].map(
    (curr) => {
      const crafters = database
        .queryRecipes(curr.url)
        .map((t) => t.crafter)
        .map((t) => {
          const matchingCrafter = allPlayers.get(t);
          if (!matchingCrafter) {
            console.warn(`unknown character ${t}`);
          }
          return matchingCrafter;
        })
        .filter((t): t is SimplifiedPlayer => Boolean(t));

      return {
        wowHeadId: curr.wowHeadId,
        name: curr.recipe,
        url: curr.url,
        crafters,
      };
    },
  );

  const mapped = groupedRecipes.map(
    ({ name, url, crafters }) =>
      `[${name}](${url}) crafters: ${crafters.map((t) => `${t.characterName} (${t.serverHandle})`).join(", ")}`,
  );

  await reply(mapped.join("\n"));
};
