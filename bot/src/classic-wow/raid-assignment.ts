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
    discordEmoji: "<:Skull:1345772813130399878>",
  },
  Cross: {
    name: "Cross",
    symbol: "{cross}",
    discordEmoji: "<:Cross:1345772808231321762>",
  },
  Square: {
    name: "Square",
    symbol: "{square}",
    discordEmoji: "<:Square:1345772815349059667>",
  },
  Triangle: {
    name: "Triangle",
    symbol: "{triangle}",
    discordEmoji: "<:Triangle:1345772816867528836>",
  },
  Circle: {
    name: "Circle",
    symbol: "{circle}",
    discordEmoji: "<:Circle:1345772806431965184>",
  },
  Diamond: {
    name: "Diamond",
    symbol: "{diamond}",
    discordEmoji: "<:Diamond:1345772809842069596>",
  },
  Moon: {
    name: "Moon",
    symbol: "{moon}",
    discordEmoji: "<:Moon:1345772811578380328>",
  },
  Star: {
    name: "Star",
    symbol: "{star}",
    discordEmoji: "<:Star:1345771449918685307>",
  },
};
