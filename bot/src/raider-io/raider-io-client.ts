import fetch from "node-fetch";
import { CharacterDetails, characterDetailsSchema } from "./types";

export async function fetchCharacterData(
  region: string,
  realmName: string,
  characterName: string,
): Promise<CharacterDetails> {
  const response = await fetch(
    `https://era.raider.io/api/characters/${region}/${realmName}/${characterName}?tier=30`,
  );
  const json = await response.json();

  return characterDetailsSchema.parse(json);
}
