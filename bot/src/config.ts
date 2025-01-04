import { z } from "zod";

const ApplicationConfigurationZod = z.object({
  GUILD: z.object({
    NAME: z.string().optional(),
    REALM: z.string(),
    REGION: z.string(),
    INFO_SHEET: z.string().nonempty(),
    STAFF_REQUEST_CHANNEL_ID: z.string().nonempty(),
    STAFF_RAID_CHANNEL_ID: z.string().nonempty(),
    DISCORD_SERVER_ID: z.string().nonempty(),
    RAID_SIGN_UP_CHANNELS: z.array(z.string()),
  }),
  WOW_HEAD: z.object({
    HOST_NAME: z.string().url(),
  }),
  RAIDER_IO_API: z.object({
    HOST_NAME: z.string().url(),
  }),
  RAID_HELPER_API: z.object({
    HOST_NAME: z.string().url(),
    API_KEY: z.string(),
  }),
  SOFTRES_IT: z.object({
    API_HOST_NAME: z.string().url(),
    HOST_NAME: z.string().url(),
  }),
  GOOGLE: z.object({
    CREDENTIALS: z.string().nonempty(),
    SHEETS_SCOPES: z.array(z.string().url()),
  }),
  DISCORD: z.object({
    PUBLIC_KEY: z.string().nonempty(),
    BOT_TOKEN: z.string().nonempty(),
    APPLICATION_ID: z.string().nonempty(),
  }),
});

export type ApplicationConfiguration = z.infer<
  typeof ApplicationConfigurationZod
>;

export const rawConfig: ApplicationConfiguration = {
  GUILD: {
    NAME: process.env.GUILD_NAME as string,
    REALM: process.env.GUILD_REALM as string,
    REGION: process.env.GUILD_REGION as string,
    INFO_SHEET: process.env.GUILD_INFO_SHEET as string,
    STAFF_REQUEST_CHANNEL_ID: process.env
      .GUILD_STAFF_REQUEST_CHANNEL_ID as string,
    STAFF_RAID_CHANNEL_ID: process.env.GUILD_STAFF_RAID_CHANNEL_ID as string,
    DISCORD_SERVER_ID: process.env.GUILD_DISCORD_SERVER_ID as string,
    RAID_SIGN_UP_CHANNELS: JSON.parse(
      process.env.GUILD_DISCORD_RAID_SIGN_UP_CHANNELS as string,
    ),
  },
  WOW_HEAD: {
    HOST_NAME: "https://www.wowhead.com",
  },
  RAIDER_IO_API: {
    HOST_NAME: "https://era.raider.io/api",
  },
  RAID_HELPER_API: {
    HOST_NAME: "https://raid-helper.dev/api/v2",
    API_KEY: process.env.RAID_HELPER_API_KEY as string,
  },
  SOFTRES_IT: {
    API_HOST_NAME: "https://softres.it/api",
    HOST_NAME: "https://softres.it",
  },
  GOOGLE: {
    CREDENTIALS: process.env.GOOGLE_CREDENTIALS as string,
    SHEETS_SCOPES: ["https://www.googleapis.com/auth/spreadsheets"],
  },
  DISCORD: {
    PUBLIC_KEY: process.env.DISCORD_PUBLIC_KEY as string,
    BOT_TOKEN: process.env.DISCORD_BOT_TOKEN as string,
    APPLICATION_ID: process.env.DISCORD_APPLICATION_ID as string,
  },
};

// This should throw errors on bootstrap.
export const CONFIG = ApplicationConfigurationZod.parse(rawConfig);
