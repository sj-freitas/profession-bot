/* eslint-disable no-console */
import { CONFIG } from "./config";
import { createClient } from "./discord/create-client";
import { createSheetClient } from "./integrations/sheets/config";
import { PlayerInfoTable } from "./integrations/sheets/player-info-table";

async function main() {
  const discordClient = await createClient();

  const channelId = `1182982442664067093`;
  const messageId = `1336680688828813373`;

  const sheetClient = createSheetClient();
  const playerInfoTable = new PlayerInfoTable(
    sheetClient,
    CONFIG.GUILD.INFO_SHEET,
  );
  const allPlayers = await playerInfoTable.getAllValues();
  const channel = await discordClient.channels.fetch(channelId);
  if (!channel || !channel.isTextBased() || !channel.isSendable()) {
    return;
  }
  const surveyMessage = await channel.messages.fetch(messageId);
  if (!surveyMessage) {
    return;
  }

  const reactions = surveyMessage.reactions.cache;

  // COMPLETED THREE SET
  const threeSetReactions = reactions.find((t) => t.emoji.name === "1️⃣");
  if (!threeSetReactions) {
    return;
  }

  const allRaiders = allPlayers.filter((t) =>
    t.discordRoles.find((x) => x === "Raider" || x === "Staff"),
  );
  const usersWithThreeSet = await threeSetReactions.users.fetch();
  const usersWithThreeSetIds = usersWithThreeSet.map((t) => t.id);

  const playersWithThreeSet = usersWithThreeSetIds.map((t) =>
    allPlayers.find((x) => x.discordId === t),
  );
  const missingThreeSet = allRaiders.filter(
    (t) => !playersWithThreeSet.find((x) => x?.discordId === t.discordId),
  );

  const mainsMissingThreeSet = missingThreeSet.map((t) => t.mainName);
  console.log(mainsMissingThreeSet);

  // COMPLETED REMNANTS
  const remnantsCompletedReaction = reactions.find(
    (t) => t.emoji.name === "3️⃣",
  );
  if (!remnantsCompletedReaction) {
    return;
  }

  const usersWithRemnantsCompleted =
    await remnantsCompletedReaction.users.fetch();
  const usersWithRemnantsCompletedIds = usersWithRemnantsCompleted.map(
    (t) => t.id,
  );
  const playersWithRemnantsCompleted = usersWithRemnantsCompletedIds.map((t) =>
    allPlayers.find((x) => x.discordId === t),
  );
  const missingRemnantsCompleted = allRaiders.filter(
    (t) =>
      !playersWithRemnantsCompleted.find((x) => x?.discordId === t.discordId),
  );

  const mainsMissingRemnants = missingRemnantsCompleted.map((t) => t.mainName);
  console.log(mainsMissingRemnants);

  // COMPLETED PRE-BIS MINIMUM GRIND
  const preBisCompletedReaction = reactions.find((t) => t.emoji.name === "2️⃣");
  if (!preBisCompletedReaction) {
    return;
  }

  const usersWithPreBisCompleted = await preBisCompletedReaction.users.fetch();
  const usersWithPreBisCompletedIds = usersWithPreBisCompleted.map((t) => t.id);
  const playersWitPreBisCompleted = usersWithPreBisCompletedIds.map((t) =>
    allPlayers.find((x) => x.discordId === t),
  );
  const missingPreBisCompleted = allRaiders.filter(
    (t) => !playersWitPreBisCompleted.find((x) => x?.discordId === t.discordId),
  );

  const mainsMissingPreBis = missingPreBisCompleted.map((t) => t.mainName);
  console.log(missingPreBisCompleted);

  console.log(`# Players Missing Naxxramas Preparation
## Players missing 3/3 set
${mainsMissingThreeSet.map((t) => ` - ${t}`).join("\n")}

## Players missing 150 Remnants
${mainsMissingRemnants.map((t) => ` - ${t}`).join("\n")}

## Players missing pre-raid sanctified
${mainsMissingPreBis.map((t) => ` - ${t}`).join("\n")}
`);

  await discordClient.destroy();
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main().catch((err) => console.error(err));
