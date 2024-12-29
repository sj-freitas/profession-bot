import { Class } from "../raider-io/types";
import { RaidRole } from "../raider-io/utils";

export const MAX_GROUP_SIZE = 5;
export const MAX_RAID_GROUP_AMOUNT = 8;
export const MAX_RAID_SIZE = MAX_GROUP_SIZE * MAX_RAID_GROUP_AMOUNT;

export interface Character {
  name: string;
  class: Class;
  role: RaidRole;
}

// Groups have 5 character slots
export interface Group {
  slots: [
    Character | null,
    Character | null,
    Character | null,
    Character | null,
    Character | null,
  ];
}

// Raids have 8 group slots
export interface Raid {
  groups: Group[];
}

export type RaidTargetId = "Skull" | "Cross" | "Square" | "Moon" | "Star" | "Circle" | "Triangle" | "Diamond"

export interface RaidTargetIcon {
  name: RaidTargetId;
  symbol: string;
  discordEmoji: string;
}

export type AllRaidTargets = {
  [key in RaidTargetId]: RaidTargetIcon;
}

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
    discordEmoji: ":skull:",
  },
  Cross: {
    name: "Cross",
    symbol: "{cross}",
    discordEmoji: ":x:",
  },
  Square: {
    name: "Square",
    symbol: "{square}",
    discordEmoji: ":blue_square:",
  },
  Triangle: {
    name: "Triangle",
    symbol: "{triangle}",
    discordEmoji: ":evergreen_tree:",
  },
  Circle: {
    name: "Circle",
    symbol: "{circle}",
    discordEmoji: ":orange_circle:",
  },
  Diamond: {
    name: "Diamond",
    symbol: "{diamond}",
    discordEmoji: ":diamonds:",
  },
  Moon: {
    name: "Moon",
    symbol: "{moon}",
    discordEmoji: ":crescent_moon:",
  },
  Star: {
    name: "Star",
    symbol: "{star}",
    discordEmoji: ":star:",
  },
}
