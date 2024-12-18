import { z } from "zod";

const ApplicationConfigurationZod = z.object({
  WOW_HEAD: z.object({
    HOST_NAME: z.string().url(),
  }),
  GOOGLE: z.object({
    API_KEY: z.string().nonempty(),
    SHEETS_SCOPES: z.array(z.string().url()),
  }),
  DISCORD: z.object({
    PUBLIC_KEY: z.string().nonempty(),
  }),
});

export type ApplicationConfiguration = z.infer<
  typeof ApplicationConfigurationZod
>;

export const rawConfig: ApplicationConfiguration = {
  WOW_HEAD: {
    HOST_NAME: "https://www.wowhead.com",
  },
  GOOGLE: {
    API_KEY: process.env.GOOGLE_API_KEY as string,
    SHEETS_SCOPES: ["https://www.googleapis.com/auth/spreadsheets"],
  },
  DISCORD: {
    PUBLIC_KEY: process.env.DISCORD_PUBLIC_KEY as string,
  },
};

// This should throw errors on bootstrap.
export const CONFIG = ApplicationConfigurationZod.parse(rawConfig);
