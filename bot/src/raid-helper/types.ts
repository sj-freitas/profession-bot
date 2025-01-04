import { z } from "zod";

const classNameSchema = z.union([
  z.literal("Tank"),
  z.literal("Healer"),
  z.literal("Melee"),
  z.literal("Ranged"),
  z.literal("Absence"),
  z.literal("Tentative"),
  z.literal("Late"),
  z.literal("Bench"),
]);

// Specs are ONLY used to infer the class
const specNameSchema = z.union([
  // Druid
  z.literal("Restoration"),
  z.literal("Feral"),
  z.literal("Balance"),
  z.literal("Guardian"),

  // Priest
  z.literal("Shadow"),
  z.literal("Holy"),
  z.literal("Discipline"),

  // Paladin
  z.literal("Retribution"),
  z.literal("Holy1"),
  z.literal("Protection1"),

  // Rogue
  z.literal("Combat"),
  z.literal("Assassination"),
  z.literal("Subtlety"),

  // Warrior
  z.literal("Fury"),
  z.literal("Arms"),
  z.literal("Protection"),

  // Hunter
  z.literal("Survival"),
  z.literal("Beastmastery"),
  z.literal("Marksmanship"),

  // Shaman
  z.literal("Elemental"),
  z.literal("Enhancement"),
  z.literal("Restoration1"),

  // Warlock
  z.literal("Destruction"),
  z.literal("Affliction"),
  z.literal("Demonology"),

  // Mage
  z.literal("Fire"),
  z.literal("Arcane"),
  z.literal("Frost"),
]);

const signUpSchema = z.object({
  entryTime: z.number().optional(),
  specName: specNameSchema.optional(),
  className: classNameSchema,
  name: z.string(), // Discord handle without spaces.. Which means that I need to look into the database, remove ALL white spaces and compare with the here
  specEmoteId: z.string().optional(),
  id: z.number().optional(),
  position: z.number().optional(),
  userId: z.string().optional(), // Is this a discord user..?
});

export const eventSchema = z.object({
  id: z.string(),
  date: z.string(),
  signUps: z.array(signUpSchema),
  description: z.string().optional(),
  channelId: z.string(),
  startTime: z.number(), // datetime in SECONDS. Multiply by 1000 for accurate date in MS.
});

const postedEventSchema = z.object({
  id: z.string(),
  channelName: z.string(),
  channelId: z.string(),
  signUpsAmount: z.number().optional(),
  color: z.string().optional(),
  description: z.string().optional(),
  channelType: z.string().optional(),
  title: z.string().optional(),
  templateId: z.string().optional(),
  templateEmoteId: z.string().optional(),
  leaderId: z.string().optional(),
  leaderName: z.string().optional(),
  closeTime: z.number().optional(),
  startTime: z.number().optional(),
  endTime: z.number().optional(),
});

export const serverEventsSchema = z.object({
  scheduledEvents: z.array(z.unknown()).optional(),
  postedEvents: z.array(postedEventSchema).optional(),
});

export type ServerEvents = z.infer<typeof serverEventsSchema>;
export type PostedEvent = z.infer<typeof postedEventSchema>;
export type RaidEvent = z.infer<typeof eventSchema>;
export type SignUp = z.infer<typeof signUpSchema>;
export type ClassName = z.infer<typeof classNameSchema>;
export type Spec = z.infer<typeof specNameSchema>;
