/* eslint-disable no-console */
import {
  CommandInteractionOptionResolver,
  Interaction,
  InteractionResponse,
} from "discord.js";

export type CommandOptions = Omit<
  CommandInteractionOptionResolver,
  "getMessage" | "getFocused"
>;
export type StringReply = (content: string) => Promise<InteractionResponse>;

export type CommandHandler<T> = (
  options: CommandOptions,
  reply: StringReply,
  payload: T,
) => Promise<void>;


export type NamedCommandHandler<T> = { id: string; handler: CommandHandler<T> };

// Unused for now, attempt at standardizing this
export interface DiscordCommand<TContext> {
  handler: NamedCommandHandler<TContext>[],
  name: string;
  slashCommand: string;
  parameters: [
    {
      name: string;
      description: string;
    }
  ]
}

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
        // Analytics for failure
        void replyDelegated(`Command failed`);
      });
  };
}

// TODO, look into having a single source of truth
// Something like the parameters and the descriptions
// Coming from the same object

