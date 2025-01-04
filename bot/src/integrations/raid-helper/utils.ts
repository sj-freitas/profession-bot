import { Class } from "../raider-io/types";
import { SignUp, Spec } from "./types";

export function inferWowClassFromSpec(specName: Spec): Class {
  switch (specName) {
    case "Balance":
    case "Feral":
    case "Restoration":
    case "Guardian":
      return "Druid";

    case "Assassination":
    case "Subtlety":
    case "Combat":
      return "Rogue";

    case "Beastmastery":
    case "Survival":
    case "Marksmanship":
      return "Hunter";

    case "Discipline":
    case "Holy":
    case "Shadow":
      return "Priest";

    case "Elemental":
    case "Enhancement":
    case "Restoration1":
      return "Shaman";

    case "Holy1":
    case "Protection1":
    case "Retribution":
      return "Paladin";

    case "Arms":
    case "Fury":
    case "Protection":
      return "Warrior";

    case "Affliction":
    case "Demonology":
    case "Destruction":
      return "Warlock";

    case "Arcane":
    case "Frost":
    case "Fire":
      return "Mage";
  }
}

const signedUpClassNames = new Set(["Healer", "Melee", "Tank", "Ranged"]);

export function isConfirmedSignup(signUp: SignUp) {
  return signedUpClassNames.has(signUp.className);
}

export function toSimplifiedHandle(discordHandle: string) {
  return discordHandle.replaceAll(/\s/g, "").replaceAll("@", "").toLowerCase();
}
