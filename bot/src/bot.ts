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
import { Database } from "./exports/mem-database";
import { loop, refreshDatabase } from "./exports/utils";
import { handleCrafter } from "./discord/professions.command";
import { worldBuffsHandler } from "./discord/worldbuffs.command";
import {
  raidAssignHandler,
  SUPPORTED_ENCOUNTERS,
} from "./discord/raidassign.command";
import { staffRequestHandler } from "./discord/staff-request.command";
import { createCommandHandler } from "./discord/commandHandler";

const FIVE_MINUTES = 5 * 60 * 1000;

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
  new SlashCommandBuilder()
    .setName("staff-request")
    .setDescription(
      "Allows you to send a message to the guild staff. Messages can be anonymous",
    )
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("The text message to send to the officers."),
    )
    .addBooleanOption((option) =>
      option
        .setName("anonymous")
        .setDescription("Inform the officers if you want your name to be known")
        .setRequired(false),
    ),
];

async function setupClient(database: Database): Promise<void> {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.MessageContent,
    ],
  });
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
    },
    {
      id: "staff-request",
      handler: staffRequestHandler,
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
  void loop(async () => refreshDatabase(database), FIVE_MINUTES);
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
