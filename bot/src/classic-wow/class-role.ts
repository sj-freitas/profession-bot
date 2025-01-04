import { Class } from "../integrations/raider-io/types";
import { Character } from "./raid-assignment";

export interface RoleFeatures {
  canStun: boolean;
  canBuff: boolean;
  canInterrupt: boolean;
}

type RoleWithRoleFeatures = {
  [role: string]: RoleFeatures;
};

type ClassRoleFeatures = {
  [className in Class]: RoleWithRoleFeatures;
};

export const CLASS_ROLE_MAP: ClassRoleFeatures = {
  Druid: {
    Tank: { canStun: false, canBuff: false, canInterrupt: false },
    Melee: { canStun: false, canBuff: false, canInterrupt: false },
    Healer: { canStun: false, canBuff: false, canInterrupt: false },
    Ranged: { canStun: false, canBuff: true, canInterrupt: false },
  },
  Hunter: {
    Melee: { canStun: false, canBuff: false, canInterrupt: false },
    Ranged: { canStun: false, canBuff: false, canInterrupt: false },
  },
  Mage: {
    Melee: { canStun: false, canBuff: false, canInterrupt: true },
    Ranged: { canStun: false, canBuff: false, canInterrupt: true },
  },
  Paladin: {
    Tank: { canStun: true, canBuff: false, canInterrupt: false },
    Melee: { canStun: true, canBuff: false, canInterrupt: true },
    Healer: { canStun: false, canBuff: true, canInterrupt: false },
  },
  Priest: {
    Ranged: { canStun: false, canBuff: true, canInterrupt: false },
    Healer: { canStun: false, canBuff: false, canInterrupt: false },
  },
  Rogue: {
    Melee: { canStun: true, canBuff: false, canInterrupt: true },
    Tank: { canStun: true, canBuff: false, canInterrupt: true },
  },
  Shaman: {},
  Warlock: {
    Ranged: { canStun: false, canBuff: false, canInterrupt: false },
    Tank: { canStun: false, canBuff: false, canInterrupt: false },
  },
  Warrior: {
    Tank: { canStun: true, canBuff: false, canInterrupt: true },
    Melee: { canStun: false, canBuff: true, canInterrupt: true },
  },
};

export function isMeleeCharacter(character: Character | null): boolean {
  if (character === null) {
    return false;
  }

  return (
    character.role === "Melee" ||
    (character.role === "Tank" && character.class !== "Warlock")
  );
}

export function isHealerCharacter(character: Character | null): boolean {
  if (character === null) {
    return false;
  }

  return character.role === "Healer";
}
