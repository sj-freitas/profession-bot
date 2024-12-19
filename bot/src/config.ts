import { z } from "zod";

const ApplicationConfigurationZod = z.object({
  GUILD: z.object({
    NAME: z.string().optional(),
    PROFESSION_SHEET: z.string().nonempty(),
  }),
  WOW_HEAD: z.object({
    HOST_NAME: z.string().url(),
  }),
  GOOGLE: z.object({
    API_KEY: z.string().nonempty(),
    SHEETS_SCOPES: z.array(z.string().url()),
  }),
  DISCORD: z.object({
    PUBLIC_KEY: z.string().nonempty(),
    BOT_TOKEN: z.string().nonempty(),
    APPLICATION_ID: z.string().nonempty(),
  }),
  RENDER: z.object({
    EXPOSED_PORT: z.string(),
  }),
});

export type ApplicationConfiguration = z.infer<
  typeof ApplicationConfigurationZod
>;

export const rawConfig: ApplicationConfiguration = {
  GUILD: {
    PROFESSION_SHEET: process.env.GUILD_PROFESSION_SHEET as string,
  },
  WOW_HEAD: {
    HOST_NAME: "https://www.wowhead.com",
  },
  GOOGLE: {
    API_KEY: process.env.GOOGLE_API_KEY as string,
    SHEETS_SCOPES: ["https://www.googleapis.com/auth/spreadsheets"],
  },
  DISCORD: {
    PUBLIC_KEY: process.env.DISCORD_PUBLIC_KEY as string,
    BOT_TOKEN: process.env.DISCORD_BOT_TOKEN as string,
    APPLICATION_ID: process.env.DISCORD_APPLICATION_ID as string,
  },
  RENDER: {
    EXPOSED_PORT: process.env.PORT as string ?? "4000",
  }
};

// This should throw errors on bootstrap.
export const CONFIG = ApplicationConfigurationZod.parse(rawConfig);
