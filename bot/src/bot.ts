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
import { Database, loadDatabase } from "./exports/mem-database";
import { exposePort } from "./create-server";

const commands = [
  new SlashCommandBuilder()
    .setName("crafter")
    .setDescription('"Finds the crafter for the recipe')
    .addStringOption((option) =>
      option.setName("recipe").setDescription("The recipe to search for"),
    ),
];

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

  exposePort(3000);
}

async function bootstrapServer(): Promise<void> {
  const rest = new REST({ version: "10" }).setToken(CONFIG.DISCORD.BOT_TOKEN);

  const sheetClient = createSheetClient();
  const data = await readProfessionData(
    sheetClient,
    "1asjzhO1UyBiQyQ_qIv_EAaGponvCbqXU0rKrEKnOwLA",
  );
  const parsed = await getGuildInfo(data);
  const database = loadDatabase(parsed);

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
