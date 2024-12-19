/* eslint-disable no-useless-return */
/* eslint-disable no-console */
import {
  REST,
  Routes,
  Client,
  Events,
  GatewayIntentBits,
  SlashCommandBuilder,
} from "discord.js";
import { CONFIG } from "./config";
import { createCommandHandler, handleCrafter } from "./discord/commandHandler";
import { getGuildInfo } from "./exports/wowHeadIntegration";
import { readProfessionData } from "./sheets/reader";
import { createSheetClient } from "./sheets/config";
import { Database, toFlattenData } from "./exports/mem-database";
import { exposePort } from "./create-server";

const FIFTEEN_MINUTES = 15 * 60 * 1000;

const commands = [
  new SlashCommandBuilder()
    .setName("crafter")
    .setDescription('"Finds the crafter for the recipe')
    .addStringOption((option) =>
      option.setName("recipe").setDescription("The recipe to search for"),
    ),
];

async function refreshDatabase(database: Database): Promise<void> {
  const sheetClient = createSheetClient();
  const data = await readProfessionData(
    sheetClient,
    "1asjzhO1UyBiQyQ_qIv_EAaGponvCbqXU0rKrEKnOwLA",
  );
  const parsed = await getGuildInfo(data);

  database.setAllRecipes(toFlattenData(parsed));

  console.log("Database refresh complete.");
}

async function loop(callback: () => Promise<void>, intervalInMs: number) {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    await callback();
    await new Promise((resolve) => {
      setTimeout(resolve, intervalInMs);
    });
  }
}

async function setupClient(database: Database): Promise<void> {
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });
  const handler = createCommandHandler(database, [
    {
      id: "crafter",
      handler: handleCrafter,
    },
  ]);

  client.on(Events.ClientReady, (readyClient) => {
    console.log(`Logged in as ${readyClient.user.tag}!`);
  });
  client.on(Events.InteractionCreate, handler);

  await client.login(CONFIG.DISCORD.BOT_TOKEN);

  exposePort(CONFIG.RENDER.EXPOSED_PORT);
}

async function bootstrapServer(): Promise<void> {
  const rest = new REST({ version: "10" }).setToken(CONFIG.DISCORD.BOT_TOKEN);

  // Loop this function
  const database = new Database();
  void loop(async () => refreshDatabase(database), FIFTEEN_MINUTES);
  await setupClient(database);

  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationCommands(CONFIG.DISCORD.APPLICATION_ID), {
      body: commands,
    });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
}

bootstrapServer().catch((err: unknown) => console.error(err));
