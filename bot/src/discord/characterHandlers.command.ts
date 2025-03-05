import { CONFIG } from "../config";
import { Database } from "../exports/mem-database";
import { createSheetClient } from "../integrations/sheets/config";
import { PlayerInfoTable } from "../integrations/sheets/player-info-table";
import { CommandHandler } from "./commandHandler";

function capitalizeFirstLetter(word: string): string {
  const [firstLetter, ...rest] = word;

  return `${firstLetter.toUpperCase()}${rest.map((t) => t.toLowerCase()).join("")}`;
}

function extractFirstWord(text: string): string | null {
  const regex = /^[A-Za-zÀ-ÖØ-öø-ÿ]+/;
  const match = text.match(regex);

  return match ? match[0] : null;
}

export const handleCharacterList: CommandHandler<Database> = async ({
  interaction,
  reply,
}): Promise<void> => {
  const playerInfoTable = new PlayerInfoTable(
    createSheetClient(),
    CONFIG.GUILD.INFO_SHEET,
  );
  const authorId =
    interaction.options.getString("user-id") ?? interaction.user.id;
  const playerInfos = await playerInfoTable.getAllValues();
  const playerInfo = playerInfos.find((t) => t.discordId === authorId);
  if (!playerInfo) {
    await reply(
      "Could not find any characters! Do `/char-add name:<NameHere>` to add characters.",
    );
    return;
  }

  const { mainName, altNames } = playerInfo;
  await reply(
    `Your main is ${mainName}${altNames.length === 0 ? "" : ` and your alts are ${altNames.join(", ")}`} do \`/char-add name:<NameHere>\` to add alts.`,
  );
};

export const handleCharacterAdd: CommandHandler<Database> = async ({
  interaction,
  reply,
}): Promise<void> => {
  const playerInfoTable = new PlayerInfoTable(
    createSheetClient(),
    CONFIG.GUILD.INFO_SHEET,
  );
  const name = interaction.options.getString("name");
  if (!name) {
    await reply("Please provide a valid character name.");
    return;
  }

  const sanitizedName = name
    .split(" ")
    .map((t) => t.trim())
    .map((t) => extractFirstWord(t))
    .filter((t): t is string => t !== null)
    .map((t) => capitalizeFirstLetter(t))[0];
  if (!sanitizedName) {
    await reply(`${name} is not a valid character name`);
    return;
  }

  const authorId = interaction.user.id;
  const playerInfos = await playerInfoTable.getAllValues();
  const playerInfo = playerInfos.find((t) => t.discordId === authorId);
  if (!playerInfo) {
    await playerInfoTable.insertValue({
      discordHandle: `@${interaction.user.username}`,
      discordId: authorId,
      discordServerHandle: `@${interaction.user.displayName}`,
      mainName: sanitizedName,
      altNames: [],
      discordRoles: [],
      atieshCharacters: [],
    });

    // No characters registered, this is a main!
    await reply(
      `There were no characters assigned to you. Added ${sanitizedName} as your main.`,
    );
    return;
  }

  if (
    [playerInfo.mainName, ...playerInfo.altNames].find(
      (t) => t === sanitizedName,
    )
  ) {
    await reply(`You already have ${sanitizedName} registered as a character.`);
    return;
  }

  // This is an alt
  const altNames = [...playerInfo.altNames, sanitizedName];
  await playerInfoTable.updateValue({
    ...playerInfo,
    altNames,
  });

  await reply(
    `Added ${sanitizedName} and your characters are ${[playerInfo.mainName, ...altNames].join(", ")}.`,
  );
};

export const handleCharacterRemove: CommandHandler<Database> = async ({
  interaction,
  reply,
}): Promise<void> => {
  const playerInfoTable = new PlayerInfoTable(
    createSheetClient(),
    CONFIG.GUILD.INFO_SHEET,
  );
  const name = interaction.options.getString("name");
  if (!name) {
    await reply("Please provide a valid character name.");
    return;
  }

  const sanitizedName = name
    .split(" ")
    .map((t) => t.trim())
    .map((t) => extractFirstWord(t))
    .filter((t): t is string => t !== null)
    .map((t) => capitalizeFirstLetter(t))[0];
  if (!sanitizedName) {
    await reply(`${name} is not a valid character name`);
    return;
  }

  const authorId = interaction.user.id;
  const playerInfos = await playerInfoTable.getAllValues();
  const playerInfo = playerInfos.find((t) => t.discordId === authorId);
  if (!playerInfo) {
    await reply(`You don't have any characters assigned to you, can't delete.`);
    return;
  }

  if (playerInfo.mainName === sanitizedName) {
    await reply(
      "Can't delete your main. If you wish to switch mains, do `/staff-request` or DM an officer.",
    );
    return;
  }

  const newAltNames = playerInfo.altNames.filter((t) => t !== sanitizedName);
  const hasAlt = newAltNames.length !== playerInfo.altNames.length;
  if (!hasAlt) {
    await reply(
      `You don't have any alts named ${sanitizedName}. Do \`/char-list\` to see what characters you have.`,
    );
    return;
  }

  await playerInfoTable.updateValue({
    ...playerInfo,
    altNames: newAltNames,
  });

  await reply(
    `Removed ${sanitizedName} and your characters are ${[playerInfo.mainName, ...newAltNames].join(", ")}.`,
  );
};
