import { AvailableProfession, PlayerProfessionsData } from "../exports/types";
import { SheetClient } from "./config";
import { readGoogleSheet } from "./utils";

function parseProf(
  title: string | undefined,
  recipes: string | undefined,
): {
  name: AvailableProfession;
  recipes: string[];
}[] {
  if (!title || !recipes) {
    return [];
  }

  return [
    {
      name: title as AvailableProfession,
      recipes: recipes.split("\n").filter((t: string) => Boolean(t.trim())),
    },
  ];
}

export async function readProfessionData(
  sheetClient: SheetClient,
  sheetId: string,
): Promise<PlayerProfessionsData[]> {
  const rows = await readGoogleSheet(sheetClient, sheetId, "Responses", "A:F");

  if (!rows) {
    throw new Error("Failed to read from sheets!");
  }

  const values = (rows ?? []).slice(1);

  return values.map(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ([_, characterName, prof1, recipes1, prof2, recipes2]) => ({
      characterName,
      professions: [
        ...parseProf(prof1, recipes1),
        ...parseProf(prof2, recipes2),
      ],
    }),
  );
}
