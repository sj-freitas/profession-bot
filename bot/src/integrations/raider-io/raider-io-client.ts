import fetch from "node-fetch";
import { CharacterDetails, characterDetailsSchema } from "./types";
import { CONFIG } from "../../config";

export async function fetchCharacterData(
  region: string,
  realmName: string,
  characterName: string,
): Promise<CharacterDetails> {
  const response = await fetch(
    `${CONFIG.RAIDER_IO_API.HOST_NAME}/characters/${region}/${realmName}/${characterName}?tier=30`,
  );
  const json = await response.json();

  return characterDetailsSchema.parse(json);
}
