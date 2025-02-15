import { Character } from "../classic-wow/raid-assignment";
import {
  WorldBuffAssignments,
  WorldBuffHistory,
} from "../integrations/sheets/get-buffers";
import { Player } from "../integrations/sheets/get-players";
import { PlayerInfo } from "../integrations/sheets/player-info-table";
import { Switcher } from "../integrations/sheets/switcher-role-data";
import { AvailableProfession, GuildProfessionData } from "./types";

interface RecipeInfo {
  crafter: string;
  recipe: string;
  wowHeadId: number;
  url: string;
  profession: string;
}

function canContain(lowerCasedSearchTerm: string, object: any): boolean {
  return Boolean(
    Object.values(object)
      .map((t) => `${t}`.toLocaleLowerCase())
      .find((t) => t.indexOf(lowerCasedSearchTerm) >= 0),
  );
}

export class Database {
  private allRecipes: RecipeInfo[] = [];

  private worldBuffAssignments: WorldBuffAssignments[] = [];

  private worldBuffHistory: WorldBuffHistory[] = [];

  private playerInfos: PlayerInfo[] = [];

  private characterRoster: Character[] = [];

  private switchers: Switcher[] = [];

  queryRecipes(searchTerm: string): RecipeInfo[] {
    // Can do with some magic here to make some words more similar to others and resolve
    // typos
    const lowerCasedSearchTerm = searchTerm.toLocaleLowerCase();

    return this.allRecipes.filter((t) => canContain(lowerCasedSearchTerm, t));
  }

  setAllRecipes(recipes: RecipeInfo[]) {
    this.allRecipes = recipes;
  }

  getWorldBuffHistory(): WorldBuffHistory[] {
    return this.worldBuffHistory;
  }

  setWorldBuffHistory(worldBuffHistory: WorldBuffHistory[]) {
    this.worldBuffHistory = worldBuffHistory;
  }

  getWorldBuffAssignments(): WorldBuffAssignments[] {
    return this.worldBuffAssignments;
  }

  setWorldBuffAssignments(worldBuffAssignments: WorldBuffAssignments[]) {
    this.worldBuffAssignments = worldBuffAssignments;
  }

  getPlayerInfos(): PlayerInfo[] {
    return this.playerInfos;
  }

  getPlayersRoster(): Player[] {
    return this.playerInfos.map((t) => ({
      discordHandle: t.discordHandle,
      discordId: t.discordId,
      serverHandle: t.discordServerHandle,
      characters: [t.mainName, ...t.altNames],
    }));
  }

  setPlayersRoster(players: PlayerInfo[]) {
    this.playerInfos = players;
  }

  getCharacterRoster(): Character[] {
    return this.characterRoster;
  }

  setCharacterRoster(characters: Character[]) {
    this.characterRoster = characters;
  }

  getSwitchers(): Switcher[] {
    return this.switchers;
  }

  setSwitchers(switchers: Switcher[]) {
    this.switchers = switchers;
  }
}

export function toFlattenData(
  parseData: Map<AvailableProfession, GuildProfessionData>,
): RecipeInfo[] {
  const professions = [...parseData.entries()];
  const professionPivot = professions.map(([profName, { recipes }]) =>
    recipes.map((currRecipe) =>
      currRecipe.crafters.map((currCrafter) => ({
        crafter: currCrafter,
        recipe: currRecipe.name,
        wowHeadId: currRecipe.id,
        url: currRecipe.url,
        profession: profName,
      })),
    ),
  );

  return professionPivot.flatMap((t) => t).flatMap((t) => t);
}

export function removeDuplicates(recipeInfo: RecipeInfo[]): RecipeInfo[] {
  return [
    ...new Map(
      recipeInfo.map((t) => [`${t.crafter}-${t.wowHeadId}`, t]),
    ).values(),
  ];
}
