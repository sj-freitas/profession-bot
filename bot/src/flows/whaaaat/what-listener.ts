import { Client, SendableChannels } from "discord.js";

const WHAAAT = "whaaat";
const LUTARYON_DISCORD_ID = "261165680445882369";

export async function handlePokeLutaryon(
  channel: SendableChannels,
): Promise<void> {
  await channel.send(`@<${LUTARYON_DISCORD_ID}> we love you! :heart: Don't ever change!`);
}

export function addWhatListener(client: Client) {
  client.on("messageCreate", (event) => {
    if (event.content.toLowerCase().indexOf(WHAAAT) < 0) {
      return;
    }

    void handlePokeLutaryon(event.channel);
  });
}
