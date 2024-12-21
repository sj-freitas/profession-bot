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
  const wowHeadResults = await queryWowHead(recipe);
  const wowHeadFiltered = removeNonSpells(removeQAResults(wowHeadResults))
    .results[0];
  const results = database.queryRecipes(wowHeadFiltered.name);

  if (results.length === 0) {
    await reply(
      `Could not find any results for ${recipe}, maybe there's a typo or we don't have crafters`,
    );
    return;
  }

  const uniqueRecipes = new Set(results.map((t) => t.recipe));
  if (uniqueRecipes.size > 1) {
    await reply(
      `Found more than one matching recipes: ${[...uniqueRecipes.values()].join(", ")}, narrow it down please.`,
    );
    return;
  }

  const { recipe: name, url } = results[0];
  const crafters = results.map((t) => t.crafter);

  await reply(`[${name}](${url}) can be crafted by: ${crafters.join(", ")}`);
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
  // const rawHistory = database.getWorldBuffHistory();
  // const rawAssignmentConfig = database.getWorldBuffAssignments();
  const serverHandleMap = new Map(players.map((t) => [t.serverHandle, t]));
  const mappedRoster = parsedRoster
    .map((t) => serverHandleMap.get(t))
    .filter((t): t is Player => Boolean(t));

  console.log(mappedRoster);
  await reply(`All good: ${mappedRoster.join(" ")} `);
  // const playerMap = new Map(players.map((t) => [t.discordHandle, t]));

  // const history = mapRawHistory(rawHistory, playerMap);
  // const assignmentConfig = mapRawAssignmentConfig(
  //   rawAssignmentConfig,
  //   playerMap,
  // );

  // const assignment = findNextAssignment({
  //   history,
  //   assignmentConfig,
  //   roster: mappedRoster,
  //   numberOfGroups: NUMBER_OF_GROUPS,
  // });

  // const formatted = formatGroupAssignmentsToMarkdown(
  //       assignment,
  //       new Map(
  //         rawAssignmentConfig.map(({ buffInfo }) => [
  //           buffInfo.shortName,
  //           buffInfo,
  //         ]),
  //       ),
  //     ),

  // await reply(formatted);
};
