/* eslint-disable no-console */
import { createClient } from "./discord/create-client";
import { updateAtieshSelectedMembers } from "./flows/atiesh-flow/update-selected-members";

async function main() {
  const discordClient = await createClient();

  await updateAtieshSelectedMembers(discordClient);

  await discordClient.destroy();
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main().catch((err) => console.error(err));
