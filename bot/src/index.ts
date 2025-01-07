/* eslint-disable no-console */

import { drawImageAssignments } from "./classic-wow/raids/temple-of-aq/cthun-images";
import { createClient } from "./discord/create-client";

async function main() {
  const discordClient = await createClient();

  const testChannel = await discordClient.channels.fetch("1324886806533115914");
  if (
    testChannel === null ||
    !testChannel.isTextBased() ||
    !testChannel.isSendable()
  ) {
    return;
  }

  const imageBuffer = await drawImageAssignments([
    "Darkshivan\nPotato",
    "Tearyn\nBoomstronk",
    "Paynex\nSnace",
    "Bibibamp\nWwolf",
    "Svajone\nPest",
    "Svajone\nPest",
    "Svajone\nPest",
    "Svajone\nPest",
  ]);
  await testChannel.send({
    content: "Test text",
    files: [{ attachment: imageBuffer, name: "cthun-assignment.png" }],
  });

  await discordClient.destroy();
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main().catch((err) => console.error(err));
