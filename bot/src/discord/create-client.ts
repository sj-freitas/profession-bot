import { Client, GatewayIntentBits } from "discord.js";
import { CONFIG } from "../config";

export async function createClient(
  onBeforeLogin: (client: Client) => void = () => {},
): Promise<Client> {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  onBeforeLogin(client);

  await client.login(CONFIG.DISCORD.BOT_TOKEN);

  return client;
}
