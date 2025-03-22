import { Class } from "../integrations/raider-io/types";
import { Character } from "./raid-assignment";

export interface RoleFeatures {
  canStun: boolean;
  canBuff: boolean;
  canInterrupt: boolean;
  canResurrect: boolean;
  canDecurse: boolean;
}

type RoleWithRoleFeatures = {
  [role: string]: RoleFeatures;
};

type ClassRoleFeatures = {
  [className in Class]: RoleWithRoleFeatures;
};

export const CLASS_ROLE_MAP: ClassRoleFeatures = {
  Druid: {
    Tank: {
      canStun: false,
      canBuff: false,
      canInterrupt: false,
      canResurrect: true,
      canDecurse: false,
    },
    Melee: {
      canStun: false,
      canBuff: false,
      canInterrupt: false,
      canResurrect: true,
      canDecurse: false,
    },
    Healer: {
      canStun: false,
      canBuff: false,
      canInterrupt: false,
      canResurrect: true,
      canDecurse: true,
    },
    Ranged: {
      canStun: false,
      canBuff: true,
      canInterrupt: false,
      canResurrect: true,
      canDecurse: true,
    },
  },
  Hunter: {
    Melee: {
      canStun: false,
      canBuff: false,
      canInterrupt: false,
      canResurrect: false,
      canDecurse: false,
    },
    Ranged: {
      canStun: false,
      canBuff: false,
      canInterrupt: false,
      canResurrect: false,
      canDecurse: false,
    },
  },
  Mage: {
    Healer: {
      canStun: false,
      canBuff: false,
      canInterrupt: true,
      canResurrect: false,
      canDecurse: true,
    },
    Ranged: {
      canStun: false,
      canBuff: false,
      canInterrupt: true,
      canResurrect: false,
      canDecurse: true,
    },
  },
  Paladin: {
    Tank: {
      canStun: true,
      canBuff: false,
      canInterrupt: false,
      canResurrect: true,
      canDecurse: false,
    },
    Melee: {
      canStun: true,
      canBuff: false,
      canInterrupt: true,
      canResurrect: true,
      canDecurse: false,
    },
    Healer: {
      canStun: false,
      canBuff: true,
      canInterrupt: false,
      canResurrect: true,
      canDecurse: false,
    },
  },
  Priest: {
    Ranged: {
      canStun: false,
      canBuff: true,
      canInterrupt: false,
      canResurrect: true,
      canDecurse: false,
    },
    Healer: {
      canStun: false,
      canBuff: false,
      canInterrupt: false,
      canResurrect: true,
      canDecurse: false,
    },
  },
  Rogue: {
    Melee: {
      canStun: true,
      canBuff: false,
      canInterrupt: true,
      canResurrect: false,
      canDecurse: false,
    },
    Tank: {
      canStun: true,
      canBuff: false,
      canInterrupt: true,
      canResurrect: false,
      canDecurse: false,
    },
  },
  Shaman: {
    Ranged: {
      canStun: false,
      canBuff: false,
      canInterrupt: true,
      canResurrect: true,
      canDecurse: false,
    },
    Healer: {
      canStun: false,
      canBuff: false,
      canInterrupt: true,
      canResurrect: true,
      canDecurse: false,
    },
    Tank: {
      canStun: false,
      canBuff: true,
      canInterrupt: true,
      canResurrect: true,
      canDecurse: false,
    },
    Melee: {
      canStun: false,
      canBuff: true,
      canInterrupt: true,
      canResurrect: true,
      canDecurse: false,
    },
  },
  Warlock: {
    Ranged: {
      canStun: false,
      canBuff: false,
      canInterrupt: false,
      canResurrect: false,
      canDecurse: false,
    },
    Tank: {
      canStun: false,
      canBuff: false,
      canInterrupt: false,
      canResurrect: false,
      canDecurse: false,
    },
  },
  Warrior: {
    Tank: {
      canStun: true,
      canBuff: false,
      canInterrupt: true,
      canResurrect: false,
      canDecurse: false,
    },
    Melee: {
      canStun: false,
      canBuff: true,
      canInterrupt: true,
      canResurrect: false,
      canDecurse: false,
    },
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
