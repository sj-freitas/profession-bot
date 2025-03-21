import { Class } from "../integrations/raider-io/types";
import { Character } from "./raid-assignment";

export interface RoleFeatures {
  canStun: boolean;
  canBuff: boolean;
  canInterrupt: boolean;
  canResurrect: boolean;
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
    },
    Melee: {
      canStun: false,
      canBuff: false,
      canInterrupt: false,
      canResurrect: true,
    },
    Healer: {
      canStun: false,
      canBuff: false,
      canInterrupt: false,
      canResurrect: true,
    },
    Ranged: {
      canStun: false,
      canBuff: true,
      canInterrupt: false,
      canResurrect: true,
    },
  },
  Hunter: {
    Melee: {
      canStun: false,
      canBuff: false,
      canInterrupt: false,
      canResurrect: false,
    },
    Ranged: {
      canStun: false,
      canBuff: false,
      canInterrupt: false,
      canResurrect: false,
    },
  },
  Mage: {
    Healer: {
      canStun: false,
      canBuff: false,
      canInterrupt: true,
      canResurrect: false,
    },
    Ranged: {
      canStun: false,
      canBuff: false,
      canInterrupt: true,
      canResurrect: false,
    },
  },
  Paladin: {
    Tank: {
      canStun: true,
      canBuff: false,
      canInterrupt: false,
      canResurrect: true,
    },
    Melee: {
      canStun: true,
      canBuff: false,
      canInterrupt: true,
      canResurrect: true,
    },
    Healer: {
      canStun: false,
      canBuff: true,
      canInterrupt: false,
      canResurrect: true,
    },
  },
  Priest: {
    Ranged: {
      canStun: false,
      canBuff: true,
      canInterrupt: false,
      canResurrect: true,
    },
    Healer: {
      canStun: false,
      canBuff: false,
      canInterrupt: false,
      canResurrect: true,
    },
  },
  Rogue: {
    Melee: {
      canStun: true,
      canBuff: false,
      canInterrupt: true,
      canResurrect: false,
    },
    Tank: {
      canStun: true,
      canBuff: false,
      canInterrupt: true,
      canResurrect: false,
    },
  },
  Shaman: {
    Ranged: {
      canStun: false,
      canBuff: false,
      canInterrupt: true,
      canResurrect: true,
    },
    Healer: {
      canStun: false,
      canBuff: false,
      canInterrupt: true,
      canResurrect: true,
    },
    Tank: {
      canStun: false,
      canBuff: true,
      canInterrupt: true,
      canResurrect: true,
    },
    Melee: {
      canStun: false,
      canBuff: true,
      canInterrupt: true,
      canResurrect: true,
    },
  },
  Warlock: {
    Ranged: {
      canStun: false,
      canBuff: false,
      canInterrupt: false,
      canResurrect: false,
    },
    Tank: {
      canStun: false,
      canBuff: false,
      canInterrupt: false,
      canResurrect: false,
    },
  },
  Warrior: {
    Tank: {
      canStun: true,
      canBuff: false,
      canInterrupt: true,
      canResurrect: false,
    },
    Melee: {
      canStun: false,
      canBuff: true,
      canInterrupt: true,
      canResurrect: false,
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
