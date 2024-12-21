/* eslint-disable no-console */
import {
  CommandInteractionOptionResolver,
  Interaction,
  InteractionResponse,
} from "discord.js";
import { Database } from "../exports/mem-database";
import { queryWowHead } from "../wowhead/client";
import { removeNonSpells, removeQAResults } from "../wowhead/helpers";
import {
  mapRawAssignmentConfig,
  mapRawHistory,
} from "../buff-management/utils";
import { findNextAssignment } from "../buff-management/find-next-assignment";
import { Player } from "../sheets/get-players";
import { formatGroupAssignmentsToMarkdown } from "../exports/world-buffs/format-group-assigments-md";
import { formatGroupsForSheets } from "../exports/world-buffs/format-groups-for-sheets";

type CommandOptions = Omit<
  CommandInteractionOptionResolver,
  "getMessage" | "getFocused"
>;
type StringReply = (content: string) => Promise<InteractionResponse>;

type CommandHandler<T> = (
  options: CommandOptions,
  reply: StringReply,
  payload: T,
) => Promise<void>;

type NamedCommandHandler<T> = { id: string; handler: CommandHandler<T> };

export function createCommandHandler<TContext>(
  context: TContext,
  handlers: NamedCommandHandler<TContext>[],
) {
  return (interaction: Interaction): void => {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    const replyDelegated: StringReply = (args: string) =>
      interaction.reply({
        content: args,
        ephemeral: true,
      });
    const commandName = interaction.commandName.trim();
    const foundHandler = handlers.find((t) => t.id === commandName);

    if (!foundHandler) {
      void replyDelegated(`Failed to understand command ${commandName}`);
      return;
    }

    foundHandler
      .handler(interaction.options, replyDelegated, context)
      .catch(() => {
        void replyDelegated(`Command failed`);
      });
  };
}

const MAX_ALLOWED_SEARCH_RESULTS = 4;

export const handleCrafter: CommandHandler<Database> = async (
  options: CommandOptions,
  reply: StringReply,
  database: Database,
): Promise<void> => {
  const recipe = options.getString("recipe");

  if (recipe === null) {
    await reply("Failed to provide a valid recipe, please try another one.");
    return;
  }

  // Match with a similar name
  // Search the database
  type SimplifiedPlayer = {
    characterName: string;
    serverHandle: string;
  };
  const allPlayers = new Map(
    database
      .getPlayersRoster()
      .map((t) =>
        t.characters.map((x) => ({
          characterName: x,
          serverHandle: t.serverHandle,
        })),
      )
      .flatMap((t: SimplifiedPlayer[]) => t)
      .map((t) => [t.characterName, t]),
  );
  const wowHeadResults = await queryWowHead(recipe);
  const wowHeadFilteredResults = removeNonSpells(
    removeQAResults(wowHeadResults),
  ).results;
  const results = wowHeadFilteredResults
    .map((t) => database.queryRecipes(t.name))
    .flatMap((t) => t);

  if (results.length === 0) {
    await reply(
      `Could not find any results for ${recipe}, maybe there's a typo or we don't have crafters`,
    );
    return;
  }

  const uniqueRecipes = new Map(results.map((t) => [t.wowHeadId, t]));
  if (uniqueRecipes.size > MAX_ALLOWED_SEARCH_RESULTS) {
    await reply(
      `Found more than ${MAX_ALLOWED_SEARCH_RESULTS} matching recipes:\n${[...uniqueRecipes.values()].map((t) => t.recipe).join("\n")}\nYou can search for a specific one by copying it from above.`,
    );
    return;
  }

  // Return the multiple results
  // Group by same recipe
  type CraftingResult = {
    wowHeadId: number;
    url: string;
    name: string;
    crafters: SimplifiedPlayer[];
  };

  const groupedRecipes = new Map<number, CraftingResult>();
  [...uniqueRecipes.values()].forEach((curr) => {
    const existing = groupedRecipes.get(curr.wowHeadId) ?? {
      wowHeadId: curr.wowHeadId,
      name: curr.recipe,
      url: curr.url,
      crafters: [],
    };

    const crafterPlayer = allPlayers.get(curr.crafter);

    if (!crafterPlayer) {
      console.warn(`unknown character ${curr.crafter}`);
      return;
    }

    existing.crafters.push(crafterPlayer);
    groupedRecipes.set(curr.wowHeadId, existing);
  });

  const mapped = [...groupedRecipes.values()].map(
    ({ name, url, crafters }) =>
      `[${name}](${url}) crafters: ${crafters.map((t) => `${t.characterName} (${t.serverHandle})`).join(", ")}`,
  );

  await reply(mapped.join("\n"));
};

const NUMBER_OF_GROUPS = 2;

export const worldBuffsHandler: CommandHandler<Database> = async (
  options: CommandOptions,
  reply: StringReply,
  database: Database,
): Promise<void> => {
  const roster = options.getString("roster");

  if (roster === null) {
    await reply("Failed to provide a valid roster.");
    return;
  }

  const parsedRoster = roster
    .split(" ")
    .map((t) => t.trim())
    .filter((t) => Boolean(t))
    .filter((t) => t.startsWith("@"));

  const players = database.getPlayersRoster();
  const rawHistory = database.getWorldBuffHistory();
  const rawAssignmentConfig = database.getWorldBuffAssignments();
  const serverHandleMap = new Map(players.map((t) => [t.serverHandle, t]));
  const mappedRoster = parsedRoster
    .map((t) => serverHandleMap.get(t))
    .filter((t): t is Player => Boolean(t));

  const playerMap = new Map(players.map((t) => [t.discordHandle, t]));

  const history = mapRawHistory(rawHistory, playerMap);
  const assignmentConfig = mapRawAssignmentConfig(
    rawAssignmentConfig,
    playerMap,
  );

  const assignment = findNextAssignment({
    history,
    assignmentConfig,
    roster: mappedRoster,
    numberOfGroups: NUMBER_OF_GROUPS,
  });

  const formatted = formatGroupAssignmentsToMarkdown(
    assignment,
    new Map(
      rawAssignmentConfig.map(({ buffInfo }) => [buffInfo.shortName, buffInfo]),
    ),
  );

  await reply(
    `Please copy paste the following message to the sign up channel:\n\`\`\`${formatted}\`\`\`\n Use the format below to copy&paste on google sheets to save\n${formatGroupsForSheets(assignment, rawAssignmentConfig)}`,
  );
};
