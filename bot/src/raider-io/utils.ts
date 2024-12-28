import { CharacterDetails } from "./types";

export type RaidRole = "Melee" | "Ranged" | "Tank" | "Healer";

function getAllRunes(characterDetails: CharacterDetails): Set<string> {
  return new Set(
    Object.values(characterDetails.characterDetails.itemDetails.items)
      .map((currItem) => currItem?.season_of_discovery?.rune?.name)
      .filter((t): t is string => Boolean(t)),
  );
}

function getAllTalents(characterDetails: CharacterDetails): Set<string> {
  return new Set(
    characterDetails.characterDetails.expansionData.trees
      .flatMap((t) => t.talents ?? [])
      .map((t) => t.spell.name),
  );
}

function getRoleOfDruid(
  characterDetails: CharacterDetails,
): "Ranged" | "Tank" | "Melee" | "Healer" {
  const allRunes = getAllRunes(characterDetails);

  if (allRunes.has("Starsurge")) {
    return "Ranged";
  }
  if (allRunes.has("Savage Roar")) {
    return "Melee";
  }
  if (allRunes.has("Lacerate")) {
    return "Tank";
  }

  return "Healer";
}

function getRoleOfHunter(
  characterDetails: CharacterDetails,
): "Ranged" | "Melee" {
  return getAllRunes(characterDetails).has("Melee Specialist")
    ? "Melee"
    : "Ranged";
}

function getRoleOfMage(
  characterDetails: CharacterDetails,
): "Ranged" | "Healer" {
  const allRunes = getAllRunes(characterDetails);
  const isHealingMage =
    allRunes.has("Regeneration") ||
    allRunes.has("Mass Regeneration") ||
    allRunes.has("Chronostatic Preservation") ||
    allRunes.has("Rewind Time") ||
    allRunes.has("Advanced Warding");

  return isHealingMage ? "Healer" : "Ranged";
}

function getRoleOfPaladin(
  characterDetails: CharacterDetails,
): "Tank" | "Melee" | "Healer" {
  // Pala can probably see whether they use beacon, reck or cs on hands
  const allRunes = getAllRunes(characterDetails);

  if (allRunes.has("Crusader Strike")) {
    return "Melee";
  }
  if (allRunes.has("Beacon of Light")) {
    return "Healer";
  }

  return "Tank";
}

function getRoleOfPriest(
  characterDetails: CharacterDetails,
): "Ranged" | "Healer" {
  return getAllTalents(characterDetails).has("Shadowform")
    ? "Ranged"
    : "Healer";
}

function getRoleOfRogue(characterDetails: CharacterDetails): "Tank" | "Melee" {
  return getAllRunes(characterDetails).has("Just a Flesh Would")
    ? "Tank"
    : "Melee";
}

function getRoleOfShaman(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  characterDetails: CharacterDetails,
): "Ranged" | "Tank" | "Melee" | "Healer" {
  // Unsupported for now...
  return "Melee";
}

function getRoleOfWarlock(
  characterDetails: CharacterDetails,
): "Ranged" | "Tank" {
  return getAllRunes(characterDetails).has("Metamorphosis") ? "Tank" : "Ranged";
}

function getRoleOfWarrior(
  characterDetails: CharacterDetails,
): "Melee" | "Tank" {
  return getAllTalents(characterDetails).has("Shield Slam") ? "Tank" : "Melee";
}

export function getRoleFromCharacter(character: CharacterDetails): RaidRole {
  // Check the class
  const characterClass = character.characterDetails.character.class.name;
  switch (characterClass) {
    case "Druid": {
      return getRoleOfDruid(character);
    }
    case "Hunter": {
      return getRoleOfHunter(character);
    }
    case "Mage": {
      return getRoleOfMage(character);
    }
    case "Paladin": {
      return getRoleOfPaladin(character);
    }
    case "Priest": {
      return getRoleOfPriest(character);
    }
    case "Rogue": {
      return getRoleOfRogue(character);
    }
    case "Shaman": {
      return getRoleOfShaman(character);
    }
    case "Warlock": {
      return getRoleOfWarlock(character);
    }
    case "Warrior": {
      return getRoleOfWarrior(character);
    }
  }
}
