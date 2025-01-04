import { z } from "zod";

export const factionSchema = z.union([
  z.literal("Alliance"),
  z.literal("Horde"),
]);

export const raidConfigSchema = z.object({
  allowDuplicate: z.boolean(),
  amount: z.number().int().positive(),
  characterNotes: z.boolean(),
  discord: z.boolean(),
  edition: z.literal("classic"),
  faction: factionSchema,
  hideReserves: z.boolean(),
  instances: z.array(z.string()),
  itemLimit: z.number().int().positive(),
  plusModifier: z.number(),
  restrictByClass: z.boolean(),
});

export const reservedItemSchema = z.object({
  name: z.string(),
  class: z.string(),
  spec: z.number(),
  items: z.array(z.number()),
  note: z.string().nullable().optional(),
});

export const raidInstanceSchema = z.object({
  _id: z.string(),
  raidId: z.string(),
  edition: z.string(),
  reserved: z.array(reservedItemSchema),
  modifications: z.number(),
  amount: z.number(),
  lock: z.boolean(),
  note: z.string(),
  raidDate: z.string().nullable(),
  hideReserves: z.boolean(),
  allowDuplicate: z.boolean(),
  itemLimit: z.number(),
  plusModifier: z.number(),
  plusType: z.number(),
  restrictByClass: z.boolean(),
  characterNotes: z.boolean(),
  instances: z.array(z.string()),
  token: z.string().nullable().optional(),
});

export type Faction = z.infer<typeof factionSchema>;
export type RaidConfig = z.infer<typeof raidConfigSchema>;
export type RaidInstance = z.infer<typeof raidInstanceSchema>;
export type ReservedItem = z.infer<typeof reservedItemSchema>;
