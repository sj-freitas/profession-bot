import { SheetClient } from "./config";
import { readGoogleSheet } from "./utils";

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

function incrementLetter(letter: string, incrementValue: number = 1): string {
  return (
    letter.substring(0, letter.length - 1) +
    String.fromCharCode(letter.charCodeAt(letter.length - 1) + incrementValue)
  );
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
      "WBHistory",
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
  }

  return groupHistory;
}
