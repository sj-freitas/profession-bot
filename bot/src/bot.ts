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
import { createCommandHandler } from "./discord/commandHandler";
import { Database } from "./exports/mem-database";
import { loop, refreshDatabase } from "./exports/utils";
import { handleCrafter } from "./discord/professions.command";
import { worldBuffsHandler } from "./discord/worldbuffs.command";
import { raidAssignHandler, SUPPORTED_ENCOUNTERS } from "./discord/raidassign.command";

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
  new SlashCommandBuilder()
    .setName("raid-assign")
    .setDescription(
      "Lists the raid assignments for a specific raid and encounter",
    )
    .addStringOption((option) =>
      option
        .setName("encounter")
        .setDescription(
          `The name of the encounter, accepted values are ${SUPPORTED_ENCOUNTERS.join(" | ")}`,
        ),
    )
    .addStringOption((option) =>
      option
        .setName("roster")
        .setDescription(
          "The discord handles for all raid participants, should be copied from the Raid-Helper announcement",
        ),
    ),
];

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
    {
      id: "raid-assign",
      handler: raidAssignHandler,
    }
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
