import { z } from "zod";

export const classSchema = z.union([
  z.literal("Warrior"),
  z.literal("Priest"),
  z.literal("Rogue"),
  z.literal("Paladin"),
  z.literal("Shaman"),
  z.literal("Mage"),
  z.literal("Warlock"),
  z.literal("Hunter"),
  z.literal("Druid"),
]);

export const realmSchema = z.object({
  id: z.number().nullable().optional(),
  connectedRealmId: z.number().nullable().optional(),
  wowRealmId: z.unknown().nullable().optional(),
  wowConnectedRealmId: z.number().nullable().optional(),
  name: z.string().optional(),
  altName: z.unknown().nullable().optional(),
  slug: z.string().nullable().optional(),
  altSlug: z.string().nullable().optional(),
  locale: z.string().nullable().optional(),
  isConnected: z.boolean().nullable().optional(),
  isHardcore: z.boolean().nullable().optional(),
  isSeasonOfDiscovery: z.boolean().nullable().optional(),
  isAnniversaryRealm: z.boolean().nullable().optional(),
  isPVPRealm: z.boolean().nullable().optional(),
  isNormalRealm: z.boolean().nullable().optional(),
  isRPRealm: z.boolean().nullable().optional(),
  realmType: z.string().nullable().optional(),
});

export const characterSchema = z.object({
  talents: z.string().nullable().optional(),
  talentsDetails: z.array(z.unknown()).nullable().optional(),
  id: z.number().nullable().optional(),
  persona_id: z.number().nullable().optional(),
  name: z.string(),
  class: z.object({
    id: z.number().nullable().optional(),
    name: classSchema,
    slug: z.string().nullable().optional(),
  }),
  race: z.object({
    id: z.number().nullable().optional(),
    name: z.string().nullable().optional(),
    slug: z.string().nullable().optional(),
    faction: z.string().nullable().optional(),
  }),
  gender: z.string().nullable().optional(),
  faction: z.string().nullable().optional(),
  level: z.number().nullable().optional(),
  spec: z.object({
    name: z.string().nullable().optional(),
    slug: z.string().nullable().optional(),
  }),
  path: z.string().optional(),
  realm: realmSchema,
  region: z.object({
    name: z.string().nullable().optional(),
    slug: z.string().nullable().optional(),
    short_name: z.string().nullable().optional(),
  }),
  recruitmentProfiles: z.array(z.unknown()).nullable().optional(),
  achievementPoints: z.number().nullable().optional(),
  honorableKills: z.number().nullable().optional(),
  itemLevelEquipped: z.number().nullable().optional(),
  thumbnailUrl: z.string().nullable().optional(),
  guild: z
    .object({
      id: z.number(),
      name: z.string().nullable().optional(),
      faction: z.string(),
      realm: realmSchema,
      region: z.object({
        name: z.string().nullable().optional(),
        slug: z.string().nullable().optional(),
        short_name: z.string().nullable().optional(),
      }),
      path: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});

export const characterCustomizationsSchema = z.object({
  profile_banner: z.unknown().nullable().optional(),
  profile_frame: z.unknown().nullable().optional(),
  biography: z.unknown().nullable().optional(),
  main_character: z.unknown().nullable().optional(),
  bnet_battletag: z.unknown().nullable().optional(),
  twitch_profile: z.string().nullable().optional(),
  youtube_profile: z.string().nullable().optional(),
  twitter_profile: z.string().nullable().optional(),
  discord_profile: z.string().nullable().optional(),
  wowhead_profile: z.string().nullable().optional(),
  isClaimed: z.boolean().nullable().optional(),
});

export const statSchema = z.object({
  base: z.number(),
  effective: z.number(),
});

export const percentageStatSchema = z.object({
  rating: z.number(),
  rating_bonus: z.number(),
  value: z.number(),
});

export const statisticsSchema = z.object({
  health: z.number(),
  power: z.number(),
  power_type: z.string(),
  strength: statSchema,
  agility: statSchema,
  intellect: statSchema,
  stamina: statSchema,
  melee_crit: percentageStatSchema,
  attack_power: z.number(),
  main_hand_damage_min: z.number(),
  main_hand_damage_max: z.number(),
  main_hand_speed: z.number(),
  main_hand_dps: z.number(),
  off_hand_damage_min: z.number(),
  off_hand_damage_max: z.number(),
  off_hand_speed: z.number(),
  off_hand_dps: z.number(),
  spell_power: z.number(),
  spell_penetration: z.number(),
  spell_crit: percentageStatSchema,
  mana_regen: z.number(),
  mana_regen_combat: z.number(),
  armor: statSchema,
  dodge: percentageStatSchema,
  parry: percentageStatSchema,
  block: percentageStatSchema,
  ranged_crit: percentageStatSchema,
  spirit: statSchema,
  defense: statSchema,
  fire_resistance: statSchema,
  holy_resistance: statSchema,
  shadow_resistance: statSchema,
  nature_resistance: statSchema,
  arcane_resistance: statSchema,
});

export const itemSlotDetailSchema = z.object({
  item_id: z.number(),
  item_level: z.number(),
  enchant: z.unknown().nullable().optional(),
  icon: z.string(),
  name: z.string(),
  item_quality: z.number().nullable().optional(),
  is_legendary: z.boolean().nullable().optional(),
  is_azerite_armor: z.boolean().nullable().optional(),
  azerite_powers: z.array(z.unknown()).nullable().optional(),
  corruption: z.object({
    added: z.number(),
    resisted: z.number(),
    total: z.number(),
  }),
  domination_shards: z.array(z.unknown()).nullable().optional(),
  gems: z.array(z.unknown()).nullable().optional(),
  bonuses: z.array(z.unknown()).nullable().optional(),
  bonus_enchants: z.array(z.unknown()).nullable().optional(),
  season_of_discovery: z
    .object({
      rune: z
        .object({
          id: z.number(),
          name: z.string(),
          spell: z.object({
            id: z.number(),
            name: z.string(),
            description: z.string(),
            icon: z.string(),
            school: z.number(),
            rank: z.unknown().nullable().optional(),
            hasCooldown: z.boolean(),
          }),
        })
        .nullable()
        .optional(),
    })
    .nullable()
    .optional(),
});

export const itemDetailsSchema = z.object({
  updated_at: z.string(),
  item_level_equipped: z.number(),
  item_level_total: z.number(),
  items: z.object({
    head: itemSlotDetailSchema.nullable().optional(),
    neck: itemSlotDetailSchema.nullable().optional(),
    shoulder: itemSlotDetailSchema.nullable().optional(),
    back: itemSlotDetailSchema.nullable().optional(),
    chest: itemSlotDetailSchema.nullable().optional(),
    waist: itemSlotDetailSchema.nullable().optional(),
    shirt: itemSlotDetailSchema.nullable().optional(),
    wrist: itemSlotDetailSchema.nullable().optional(),
    hands: itemSlotDetailSchema.nullable().optional(),
    legs: itemSlotDetailSchema.nullable().optional(),
    feet: itemSlotDetailSchema.nullable().optional(),
    finger1: itemSlotDetailSchema.nullable().optional(),
    finger2: itemSlotDetailSchema.nullable().optional(),
    trinket1: itemSlotDetailSchema.nullable().optional(),
    trinket2: itemSlotDetailSchema.nullable().optional(),
    mainhand: itemSlotDetailSchema.nullable().optional(),
    ranged: itemSlotDetailSchema.nullable().optional(),
    offhand: itemSlotDetailSchema.nullable().optional(),
  }),
});

export const talentTreeSchema = z.object({
  tab: z.object({
    id: z.number(),
    slug: z.string(),
    classId: z.number(),
    background: z.string(),
    ordinal: z.number(),
  }),
  talents: z.array(
    z.object({
      rank: z.unknown().nullable().optional(),
      spell: z.object({
        id: z.number(),
        name: z.string(),
        description: z.string(),
        icon: z.string(),
        school: z.number(),
        rank: z.unknown().nullable().optional(),
        hasCooldown: z.boolean(),
      }),
      talent: z.object({
        id: z.number(),
        tabId: z.number(),
        tierId: z.number(),
        columnIndex: z.number(),
        indexInRow: z.number(),
        talentsInRow: z.number(),
        spellRankIds: z.array(z.number()),
      }),
    }),
  ).nullable().optional(),
});

export const expansionDataSchema = z.object({
  expansionId: z.number(),
  spec: z.object({
    slug: z.string(),
    name: z.string(),
    pointAllocation: z.array(z.number()).nullable().optional(),
  }),
  trees: z.array(talentTreeSchema),
  wowheadCalculator: z.object({
    code: z.string(),
    class: z.string(),
  }),
  makgoraKills: z.unknown().nullable().optional(),
  pvpRank: z.unknown().nullable().optional(),
  isGhost: z.unknown().nullable().optional(),
  ghostedAt: z.unknown().nullable().optional(),
  isSelfFound: z.unknown().nullable().optional(),
  selfFoundOptedOutAt: z.unknown().nullable(),
});

export const characterDetailsSchema = z.object({
  characterDetails: z.object({
    character: characterSchema,
    characterCustomizations: characterCustomizationsSchema,
    patronLevel: z.unknown().nullable().optional(),
    meta: z.object({
      firstCrawledAt: z.string().nullable().optional(),
      lastCrawledAt: z.string().nullable().optional(),
      loggedOutAt: z.string().nullable().optional(),
      missingAt: z.unknown().nullable().optional(),
    }),
    user: z.unknown().nullable().optional(),
    itemDetails: itemDetailsSchema,
    tier: z.unknown().nullable().optional(),
    isMissingPersonaFields: z.boolean().nullable().optional(),
    statistics: statisticsSchema,
    isTournamentProfile: z.boolean().nullable().optional(),
    expansionData: expansionDataSchema,
  }),
});

export type CharacterDetails = z.infer<typeof characterDetailsSchema>;

export type Class = z.infer<typeof classSchema>;
