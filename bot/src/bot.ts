/* eslint-disable no-console */
import { REST, Routes, Events, SlashCommandBuilder, Client } from "discord.js";
import { CONFIG } from "./config";
import { Database } from "./exports/mem-database";
import { loop, refreshDatabase } from "./exports/utils";
import { handleCrafter } from "./discord/professions.command";
import { worldBuffsHandler } from "./discord/worldbuffs.command";
import { raidAssignHandler } from "./discord/raidassign.command";
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
import { automaticFlushOfDiscordRoles } from "./flows/auto-flush-roles/recurring-job";
import {
  handleCharacterAdd,
  handleCharacterList,
  handleCharacterRemove,
} from "./discord/characterHandlers.command";
import { addWhatListener } from "./flows/whaaaat/what-listener";
import { updateListOfAtieshCandidates } from "./flows/atiesh-flow/update-list-of-candidates";
import { updateAtieshSelectedMembers } from "./flows/atiesh-flow/update-selected-members";

const { RAID_SIGN_UP_CHANNELS } = CONFIG.GUILD;
const FIVE_MINUTES = 5 * 60 * 1000;
const FORTY_FIVE_MINUTES = 45 * 60 * 1000;
const TWO_HOURS = 2 * 60 * 60 * 1000;

const commands = [
  new SlashCommandBuilder()
    .setName("crafter")
    .setDescription('"Finds the crafter for the recipe')
    .addStringOption((option) =>
      option
        .setName("recipe")
        .setDescription("The recipe to search for")
        .setRequired(true),
    ),
  new SlashCommandBuilder()
    .setName("world-buffs")
    .setDescription(
      "Creates a list possible for assignees for world buffs based on who buffed least times",
    )
    .addStringOption((option) =>
      option
        .setName("event-id")
        .setDescription("The event id on the discord server")
        .setRequired(true),
    ),
  new SlashCommandBuilder()
    .setName("raid-assign")
    .setDescription(
      "Lists the raid assignments for a specific raid and encounter",
    )
    .addStringOption((option) =>
      option
        .setName("encounter")
        .setDescription(`The name of the encounter, like aq-cthun, raid, etc.`)
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("event-id")
        .setDescription("The event id on the discord server")
        .setRequired(true),
    ),
  new SlashCommandBuilder()
    .setName("staff-request")
    .setDescription(
      "Allows you to send a message to the guild staff. Messages can be anonymous",
    )
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("The text message to send to the officers.")
        .setRequired(true),
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
      option
        .setName("ticket-id")
        .setDescription("The ticket ID to reply to")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("The text message for the officers to send.")
        .setRequired(true),
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
        .setDescription("The title of the raid, keep it simple and short")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("description")
        .setDescription(
          "Insert the instances name, it will be used also to create soft-reserves.",
        )
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("time")
        .setDescription(
          "Format: `HH:mm` or `hh:mm a` in server time, something like `20:00`",
        )
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("date")
        .setDescription(
          "Format: `dd-MM-yyyy` format, for example `09-01-2025` = first of January.",
        )
        .setRequired(true),
    ),
  new SlashCommandBuilder()
    .setName("ad-hoc-delete")
    .setDescription("Deletes all ad-hoc raids in your name"),
  new SlashCommandBuilder()
    .setName("char-list")
    .setDescription("Lists all the characters you own")
    .addStringOption((option) =>
      option
        .setName("user-id")
        .setDescription(
          "[Optional] The discord user id of the user to fetch characters from",
        )
        .setRequired(false),
    ),
  new SlashCommandBuilder()
    .setName("char-add")
    .setDescription(
      "If this is your first time adds your main, future calls add your alts.",
    )
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Character name to add")
        .setRequired(true),
    ),
  new SlashCommandBuilder()
    .setName("char-delete")
    .setDescription(
      "Removes an alt from our database, you can't remove a main.",
    )
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Character name to remove")
        .setRequired(true),
    ),
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
    {
      id: "char-add",
      handler: handleCharacterAdd,
    },
    {
      id: "char-list",
      handler: handleCharacterList,
    },
    {
      id: "char-delete",
      handler: handleCharacterRemove,
    },
  ]);

  return await createClient((client) => {
    addChannelListener(client, RAID_SIGN_UP_CHANNELS);
    addWhatListener(client);
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

  // Recurring Jobs
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
  void loop(async () => updateListOfAtieshCandidates(discordClient), TWO_HOURS);
  void loop(
    async () => updateAtieshSelectedMembers(discordClient),
    FIVE_MINUTES,
  );
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
  void loop(
    async () => automaticFlushOfDiscordRoles(discordClient, sheetClient),
    TWO_HOURS,
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
