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
import {
  createCommandHandler,
  handleCrafter,
  worldBuffsHandler,
} from "./discord/commandHandler";
import { getGuildInfo } from "./exports/wowHeadIntegration";
import { readProfessionData } from "./sheets/parse-prof";
import { createSheetClient } from "./sheets/config";
import { Database, toFlattenData } from "./exports/mem-database";
import { getPlayers } from "./sheets/get-players";
import { getAllBuffHistory, getWorldBuffInfo } from "./sheets/get-buffers";

const FIFTEEN_MINUTES = 15 * 60 * 1000;

const commands = [
  new SlashCommandBuilder()
    .setName("crafter")
    .setDescription('"Finds the crafter for the recipe')
    .addStringOption((option) =>
      option.setName("recipe").setDescription("The recipe to search for"),
    ),
  new SlashCommandBuilder()
    .setName("world-buffs")
    .setDescription(
      "Creates a list possible for assignees for world buffs based on who buffed least times",
    )
    .addStringOption((option) =>
      option
        .setName("roster")
        .setDescription(
          "The discord handles for all raid participants, should be copied from the Raid-Helper announcement",
        ),
    ),
];

async function refreshDatabase(database: Database): Promise<void> {
  console.log("Database refresh started.");

  const sheetClient = createSheetClient();
  const data = await readProfessionData(sheetClient, CONFIG.GUILD.INFO_SHEET);
  const parsed = await getGuildInfo(data);
  const roster = await getPlayers(sheetClient, CONFIG.GUILD.INFO_SHEET);
  const worldBuffAssignments = await getWorldBuffInfo(
    sheetClient,
    CONFIG.GUILD.INFO_SHEET,
  );
  const worldBuffHistory = await getAllBuffHistory(
    sheetClient,
    CONFIG.GUILD.INFO_SHEET,
    worldBuffAssignments,
  );

  database.setAllRecipes(toFlattenData(parsed));
  database.setPlayersRoster(roster);
  database.setWorldBuffAssignments(worldBuffAssignments);
  database.setWorldBuffHistory(worldBuffHistory);

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
    {
      id: "world-buffs",
      handler: worldBuffsHandler,
    },
  ]);

  client.on(Events.ClientReady, (readyClient) => {
    console.log(`Logged in as ${readyClient.user.tag}!`);
  });
  client.on(Events.InteractionCreate, handler);

  await client.login(CONFIG.DISCORD.BOT_TOKEN);
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
