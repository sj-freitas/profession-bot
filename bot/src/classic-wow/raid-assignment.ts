import { Class } from "../integrations/raider-io/types";
import { RaidRole } from "../integrations/raider-io/utils";

export const MAX_GROUP_SIZE = 5;
export const MAX_RAID_GROUP_AMOUNT = 8;
export const MAX_RAID_SIZE = MAX_GROUP_SIZE * MAX_RAID_GROUP_AMOUNT;

export interface Character {
  name: string;
  class: Class;
  role: RaidRole;
}

export type GroupSlots = [
  Character | null,
  Character | null,
  Character | null,
  Character | null,
  Character | null,
];

// Groups have 5 character slots
export interface Group {
  slots: GroupSlots;
}

// Raids have 8 group slots
export interface Raid {
  groups: Group[];
}

export type RaidTargetId =
  | "Skull"
  | "Cross"
  | "Square"
  | "Moon"
  | "Star"
  | "Circle"
  | "Triangle"
  | "Diamond";

export interface RaidTargetIcon {
  name: RaidTargetId;
  symbol: string;
  discordEmoji: string;
}

export type AllRaidTargets = {
  [key in RaidTargetId]: RaidTargetIcon;
};

export interface RaidTarget {
  icon: RaidTargetIcon;
  name: string;
}

export interface AssignmentDetails {
  id: string; // Interrupts, Stuns, etc.
  description: string; // tanked by, stunned by, etc.
  characters: Character[];
}

export interface TargetAssignment {
  raidTarget: RaidTarget;
  assignments: AssignmentDetails[];
}

export const ALL_RAID_TARGETS: AllRaidTargets = {
  Skull: {
    name: "Skull",
    symbol: "{skull}",
    discordEmoji: ":Skull:",
  },
  Cross: {
    name: "Cross",
    symbol: "{cross}",
    discordEmoji: ":Cross:",
  },
  Square: {
    name: "Square",
    symbol: "{square}",
    discordEmoji: ":Square:",
  },
  Triangle: {
    name: "Triangle",
    symbol: "{triangle}",
    discordEmoji: ":Triangle:",
  },
  Circle: {
    name: "Circle",
    symbol: "{circle}",
    discordEmoji: ":Circle:",
  },
  Diamond: {
    name: "Diamond",
    symbol: "{diamond}",
    discordEmoji: ":Diamond:",
  },
  Moon: {
    name: "Moon",
    symbol: "{moon}",
    discordEmoji: ":Moon:",
  },
  Star: {
    name: "Star",
    symbol: "{star}",
    discordEmoji: ":Star:",
  },
};
