import { SheetClient } from "./config";
import { calculateRange, readGoogleSheet } from "./utils";

export const NUMBER_OF_GROUPS = 2;
export interface WorldBuffInfo {
  longName: string;
  shortName: string;
  duration: number;
}

export interface WorldBuffAssignments {
  buffInfo: WorldBuffInfo;
  discordHandles: string[];
}

export async function getWorldBuffInfo(
  sheetClient: SheetClient,
  sheetId: string,
): Promise<WorldBuffAssignments[]> {
  const rows = await readGoogleSheet(
    sheetClient,
    sheetId,
    "WBManagement",
    "A:B",
  );

  if (!rows) {
    throw new Error("Failed to read from sheets!");
  }

  const values = (rows ?? []).slice(1) as string[][];
  const PARSER_REGEX = /^\[(\d+?)h\]\s(.*?)\s\((.*?)\)$/;

  // Entries look like this:
  // [1h] Thorium Brotherhood (red)

  return values.map(([buffInfo, handles]) => {
    const matches = buffInfo
      .trim()
      .match(PARSER_REGEX)
      ?.map((t) => t.trim());

    if (!matches) {
      throw new Error(`Unexpected value ${buffInfo} - not parsable!`);
    }

    const [, unparsedDuration, longName, shortName] = matches;

    return {
      buffInfo: {
        duration: Number.parseInt(unparsedDuration, 10),
        longName,
        shortName,
      },
      discordHandles: handles
        .split(";")
        .map((t) => t.trim())
        .filter((t) => Boolean(t)),
    };
  });
}

export interface WorldBuffHistory {
  groups: {
    name: string;
    entries: { buff: WorldBuffInfo; assignees: string[] }[];
  }[];
}

function numberToColumn(numberValue: number) {
  let column = "";
  let value = numberValue;

  while (value >= 0) {
    column = String.fromCharCode((value % 26) + 65) + column;
    value = Math.floor(value / 26) - 1;
  }
  return column;
}

function columnToNumber(column: string): number {
  let num = 0;
  for (let i = 0; i < column.length; i += 1) {
    num = num * 26 + (column.charCodeAt(i) - 65 + 1);
  }
  return num - 1;
}

function incrementLetter(letter: string, incrementValue: number = 1): string {
  const letterValue = columnToNumber(letter);

  return numberToColumn(letterValue + incrementValue);
}

function getColumnRanges(
  startColumn: string,
  numberOfGroups: number,
  index: number,
): [string, string] {
  return [
    incrementLetter(startColumn, index * numberOfGroups),
    incrementLetter(startColumn, index * numberOfGroups + numberOfGroups - 1),
  ];
}

function isInvalidGroup(nextGroup: any[][] | null | undefined): boolean {
  if (nextGroup === null || nextGroup === undefined) {
    return false;
  }

  // Possibly more checks here

  return true;
}

const WORLD_BUFF_HISTORY_TAB_NAME = "WBHistory";

export async function getNamesOfAllGroups(
  sheetClient: SheetClient,
  sheetId: string,
): Promise<string[]> {
  const allGroupNames = await readGoogleSheet(
    sheetClient,
    sheetId,
    WORLD_BUFF_HISTORY_TAB_NAME,
    "A1:ZZ1",
  );
  const singleRow: string[] = allGroupNames?.[0] ?? [];

  return singleRow;
}

export async function addToHistory(
  sheetClient: SheetClient,
  spreadsheetId: string,
  groups: string[][],
): Promise<void> {
  const [allGroupNames] =
    (await readGoogleSheet(
      sheetClient,
      spreadsheetId,
      WORLD_BUFF_HISTORY_TAB_NAME,
      "A1:ZZ1",
    )) ?? [];
  if (!allGroupNames) {
    return;
  }

  const startColumn = incrementLetter("A", allGroupNames.length);
  await sheetClient.spreadsheets.values.append({
    spreadsheetId,
    range: `${WORLD_BUFF_HISTORY_TAB_NAME}!${calculateRange({ x: startColumn, y: 1 }, 1)}`, // : "A3:C3"
    valueInputOption: "RAW",
    requestBody: {
      majorDimension: "COLUMNS",
      values: groups,
    },
  });
}

export async function getAllBuffHistory(
  sheetClient: SheetClient,
  sheetId: string,
  buffData: WorldBuffAssignments[],
  numberOfGroups: number = NUMBER_OF_GROUPS,
): Promise<WorldBuffHistory[]> {
  const START_COLUMN = "A";
  const groupHistory: WorldBuffHistory[] = [];

  let index = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const [left, right] = getColumnRanges(START_COLUMN, numberOfGroups, index);
    const range = `${left}:${right}`;
    const readCurrGroup = await readGoogleSheet(
      sheetClient,
      sheetId,
      WORLD_BUFF_HISTORY_TAB_NAME,
      range,
    );

    const hasValidGroups = isInvalidGroup(readCurrGroup);
    if (!hasValidGroups) {
      break;
    }

    const pivotedTable = ((readCurrGroup ?? []) as string[][]).reduce<
      string[][]
    >((res, currLine) => {
      currLine.forEach((currEntry, idx) => {
        res[idx] = res[idx] ?? [];
        res[idx].push(currEntry);
      });

      return res;
    }, []);
    const groups = pivotedTable.map(([title, ...rows]) => ({
      name: title,
      entries: rows.map((currRow, idx) => ({
        buff: buffData[idx].buffInfo,
        assignees: currRow
          .split(";")
          .map((t) => t.trim())
          .filter((t) => Boolean(t)),
      })),
    }));

    groupHistory.push({
      groups,
    });

    index += 1;

    await new Promise((resolve) => {
      setTimeout(resolve, 5000);
    });
  }

  return groupHistory;
}
