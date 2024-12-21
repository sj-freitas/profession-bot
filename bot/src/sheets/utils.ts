import { SheetClient } from "./config";

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
