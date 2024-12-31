// eslint-disable-next-line camelcase
import { google, sheets_v4 } from "googleapis";
import { CONFIG } from "../config";

// eslint-disable-next-line camelcase
export type SheetClient = sheets_v4.Sheets;

export function createSheetClient(): SheetClient {
  const credentials = JSON.parse(CONFIG.GOOGLE.CREDENTIALS);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: CONFIG.GOOGLE.SHEETS_SCOPES,
  });

  return google.sheets({
    version: "v4",
    auth,
  });
}
