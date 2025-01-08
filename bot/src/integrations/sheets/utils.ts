import { SheetClient } from "./config";

export function incrementLetter(
  letter: string,
  incrementValue: number = 1,
): string {
  return (
    letter.substring(0, letter.length - 1) +
    String.fromCharCode(letter.charCodeAt(letter.length - 1) + incrementValue)
  );
}

export async function readGoogleSheet(
  googleSheetClient: SheetClient,
  sheetId: string,
  tabName: string,
  range: string,
) {
  const res = await googleSheetClient.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${tabName}!${range}`,
  });

  return res.data.values;
}

export function calculateRange(
  { x, y }: { x: string; y: number },
  range: number,
): string {
  const start = `${x}${y}`;
  const end = `${incrementLetter(x, range - 1)}${y}`;

  return `${start}:${end}`;
}

export async function appendRowToGoogleSheet(
  googleSheetClient: SheetClient,
  spreadsheetId: string,
  tabName: string,
  startCell: { x: string; y: number },
  values: string[],
) {
  await googleSheetClient.spreadsheets.values.append({
    spreadsheetId,
    range: `${tabName}!${calculateRange(startCell, values.length)}`, // : "A3:C3"
    valueInputOption: "RAW",
    requestBody: {
      majorDimension: "ROWS",
      values: [values],
    },
  });
}

export async function replaceValueInGoogleSheet(
  googleSheetClient: SheetClient,
  spreadsheetId: string,
  tabName: string,
  startCell: { x: string; y: number },
  values: string[],
) {
  await googleSheetClient.spreadsheets.values.update({
    spreadsheetId,
    range: `${tabName}!${calculateRange(startCell, values.length)}`, // : "A3:C3"
    valueInputOption: "RAW",
    requestBody: {
      majorDimension: "ROWS",
      values: [values],
    },
  });
}
