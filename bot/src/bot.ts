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
import { addChannelListener } from "./flows/soft-reserves/channel-listener";
import { pollChannelsForSoftReserves } from "./flows/soft-reserves/recurring-job";
import { pollChannelsForAssignments } from "./flows/raid-assignments/recurring-jobs";
import { handleMissingSoftreserves } from "./discord/list-missing-softreserves.command";
import { cleanUpRaidChannels } from "./flows/clean-up-raid-channels/recurring-job";
import { tryUpdateWorldBuffItemRotation } from "./flows/world-buff-config/recurring-job";
import { createSheetClient } from "./integrations/sheets/config";
import { getAllSoftresTokens } from "./discord/get-softres-token.command";
import { tryUpdateSwitcherPost } from "./flows/switcher-config/recurring-job";
import { pollChannelsForWorldBuffHistory } from "./flows/update-wb-history/recurring-job";
import {
  handleCreateAdHocRaid,
  handleDeleteAdHocRaid,
} from "./discord/ad-hoc-raid-creator.command";

const { RAID_SIGN_UP_CHANNELS } = CONFIG.GUILD;
const FIVE_MINUTES = 5 * 60 * 1000;
const FORTY_FIVE_MINUTES = 45 * 60 * 1000;

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
        .setName("event-id")
        .setDescription("The event id on the discord server"),
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
        .setName("event-id")
        .setDescription("The event id on the discord server"),
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
  new SlashCommandBuilder()
    .setName("missing-sr")
    .setDescription(
      "Lists all players for a specific raid event that are missing their SRs",
    )
    .addStringOption((option) =>
      option
        .setName("event-id")
        .setDescription("The raid event to list missing soft-reserves")
        .setRequired(true),
    ),
  new SlashCommandBuilder()
    .setName("get-sr-tokens")
    .setDescription("Gets all softres tokens for this channel"),
  new SlashCommandBuilder()
    .setName("ad-hoc-create")
    .setDescription("Creates an ad-hoc raid in your name")
    .addStringOption((option) =>
      option
        .setName("title")
        .setDescription("The title of the raid, keep it simple and short"),
    )
    .addStringOption((option) =>
      option
        .setName("description")
        .setDescription(
          "The description will be used also to automatically create the soft-reserves, name the instances that you'll be doing here.",
        ),
    )
    .addStringOption((option) =>
      option
        .setName("time")
        .setDescription(
          "Time must be in the `HH:mm` or `hh:mm a` format in server time, something like `20:00`",
        ),
    )
    .addStringOption((option) =>
      option
        .setName("date")
        .setDescription(
          "Date mus be in `dd-MM-yyyy` format, for example `09-01-2025` = first of January.",
        ),
    ),
  new SlashCommandBuilder()
    .setName("ad-hoc-delete")
    .setDescription("Deletes all ad-hoc raids in your name"),
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
    {
      id: "missing-sr",
      handler: handleMissingSoftreserves,
    },
    {
      id: "get-sr-tokens",
      handler: getAllSoftresTokens,
    },
    {
      id: "ad-hoc-create",
      handler: handleCreateAdHocRaid,
    },
    {
      id: "ad-hoc-delete",
      handler: handleDeleteAdHocRaid,
    },
  ]);

  return await createClient((client) => {
    addChannelListener(client, RAID_SIGN_UP_CHANNELS);
    client.on(Events.ClientReady, (readyClient) => {
      console.log(`Logged in as ${readyClient.user.tag}!`);
    });
    client.on(Events.InteractionCreate, handler);
  });
}

async function bootstrapServer(): Promise<void> {
  const sheetClient = createSheetClient();
  const database = new Database();
  await refreshDatabase(database);

  const rest = new REST({ version: "10" }).setToken(CONFIG.DISCORD.BOT_TOKEN);
  const discordClient = await setupClient(database);

  void loop(
    async () =>
      cleanUpRaidChannels(discordClient, CONFIG.GUILD.RAID_SIGN_UP_CHANNELS),
    FORTY_FIVE_MINUTES,
  );
  void loop(
    async () =>
      pollChannelsForWorldBuffHistory(
        database,
        CONFIG.GUILD.RAID_SIGN_UP_CHANNELS,
      ),
    FORTY_FIVE_MINUTES,
  );
  void loop(async () => refreshDatabase(database), FIVE_MINUTES);
  void loop(async () => runJob(discordClient), FIVE_MINUTES);
  void loop(
    async () =>
      pollChannelsForSoftReserves(discordClient, RAID_SIGN_UP_CHANNELS),
    FIVE_MINUTES,
  );
  void loop(
    async () =>
      pollChannelsForAssignments(
        discordClient,
        database,
        RAID_SIGN_UP_CHANNELS,
      ),
    FIVE_MINUTES,
  );
  void loop(
    async () => tryUpdateWorldBuffItemRotation(discordClient, sheetClient),
    FORTY_FIVE_MINUTES,
  );
  void loop(
    async () => tryUpdateSwitcherPost(discordClient, sheetClient),
    FORTY_FIVE_MINUTES,
  );

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
