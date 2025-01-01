/* eslint-disable no-useless-return */
/* eslint-disable no-console */
import { REST, Routes, Events, SlashCommandBuilder, Client } from "discord.js";
import { CONFIG } from "./config";
import { Database } from "./exports/mem-database";
import { loop, refreshDatabase } from "./exports/utils";
import { handleCrafter } from "./discord/professions.command";
import { worldBuffsHandler } from "./discord/worldbuffs.command";
import {
  raidAssignHandler,
  SUPPORTED_ENCOUNTERS,
} from "./discord/raidassign.command";
import {
  staffRequestHandler,
  staffReplyHandler,
} from "./discord/staff-request.command";
import { createCommandHandler } from "./discord/commandHandler";
import { createClient } from "./discord/create-client";
import { deleteMessagesHandler } from "./discord/delete-messages.command";
import { runJob } from "./discord/crafting-list.job";

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
  new SlashCommandBuilder()
    .setName("staff-reply")
    .setDescription("Allows a staff member to reply to a message")
    .addStringOption((option) =>
      option.setName("ticket-id").setDescription("The ticket ID to reply to"),
    )
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("The text message for the officers to send."),
    ),
  new SlashCommandBuilder()
    .setName("nuke")
    .setDescription("Deletes all messages from a channel"),
];

async function setupClient(database: Database): Promise<Client> {
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
    {
      id: "staff-reply",
      handler: staffReplyHandler,
    },
    {
      id: "nuke",
      handler: deleteMessagesHandler,
    },
  ]);

  return await createClient((client) => {
    client.on(Events.ClientReady, (readyClient) => {
      console.log(`Logged in as ${readyClient.user.tag}!`);
    });
    client.on(Events.InteractionCreate, handler);
  });
}

async function bootstrapServer(): Promise<void> {
  const rest = new REST({ version: "10" }).setToken(CONFIG.DISCORD.BOT_TOKEN);
  const database = new Database();
  const discordClient = await setupClient(database);

  void loop(async () => refreshDatabase(database), FIVE_MINUTES);
  void loop(async () => runJob(discordClient), FIVE_MINUTES);

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
