/* eslint-disable no-console */
import {
  APIUser,
  CommandInteractionOptionResolver,
  Interaction,
  InteractionResponse,
  User,
} from "discord.js";

export type CommandOptions = Omit<
  CommandInteractionOptionResolver,
  "getMessage" | "getFocused"
>;

export type SendMessageToChannel = (
  channel: string,
  message: string,
) => Promise<void>;

export type SendDirectMessageToUser = (
  userTag: string,
  message: string,
) => Promise<void>;

export type StringReply = (content: string) => Promise<InteractionResponse>;

export interface CommandHandlerInput<TContext> {
  options: CommandOptions;
  reply: StringReply;
  payload: TContext;
  sendMessageToChannel: SendMessageToChannel;
  sendDirectMessageToUser: SendDirectMessageToUser;
  author?: User | APIUser;
}

export type CommandHandler<TContext> = (
  input: CommandHandlerInput<TContext>,
) => Promise<void>;

export type NamedCommandHandler<TContext> = {
  id: string;
  handler: CommandHandler<TContext>;
};

// Unused for now, attempt at standardizing this
export interface DiscordCommand<TContext> {
  handler: NamedCommandHandler<TContext>[];
  name: string;
  slashCommand: string;
  parameters: [
    {
      name: string;
      description: string;
    },
  ];
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

    const sendMessageToChannel = async (
      channelName: string,
      message: string,
    ) => {
      const channel = interaction.client.channels.cache.get(channelName);

      if (!channel?.isSendable()) {
        await replyDelegated("Invalid channel provided!");
        return;
      }

      await channel.send(message);
    };

    const sendDirectMessageToUser = async (
      userTag: string,
      message: string,
    ) => {
      const user = interaction.client.users.cache.find(
        (u) => u.tag === userTag,
      );

      if (!user) {
        await replyDelegated("Invalid username provided provided!");
        return;
      }

      await user.send(message);
    };

    if (!foundHandler) {
      void replyDelegated(`Failed to understand command ${commandName}`);
      return;
    }

    foundHandler
      .handler({
        options: interaction.options,
        reply: replyDelegated,
        payload: context,
        sendMessageToChannel,
        sendDirectMessageToUser,
        author: interaction.member?.user,
      })
      .catch(() => {
        // Analytics for failure
        void replyDelegated(`Command failed`);
      });
  };
}

// TODO, look into having a single source of truth
// Something like the parameters and the descriptions
// Coming from the same object
