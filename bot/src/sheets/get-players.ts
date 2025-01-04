import { SheetClient } from "./config";
import { readGoogleSheet } from "./utils";

export interface Player {
  discordHandle: string;
  discordId: string;
  serverHandle: string;
  characters: string[];
}

export async function getPlayers(
  sheetClient: SheetClient,
  sheetId: string,
): Promise<Player[]> {
  const rows = await readGoogleSheet(
    sheetClient,
    sheetId,
    "DiscordMapping",
    "A:D",
  );

  if (!rows) {
    throw new Error("Failed to read from sheets!");
  }

  const values = (rows ?? []).slice(1) as string[][];

  return values
    .map(([discordHandle, characters, serverHandle, discordId]) => ({
      discordHandle: discordHandle?.trim(),
      characters: characters?.split(";").map((t) => t.trim()),
      serverHandle: serverHandle?.trim(),
      discordId: discordId.trim(),
    }))
    .filter((t) => t.discordHandle && t.characters && t.serverHandle);
}
