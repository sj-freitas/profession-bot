// eslint-disable-next-line camelcase
import { google, sheets_v4 } from "googleapis";
import { CONFIG } from "../config";

// eslint-disable-next-line camelcase
export type SheetClient = sheets_v4.Sheets;

export function createSheetClient(): SheetClient {
  const auth = new google.auth.GoogleAuth({
    apiKey: CONFIG.GOOGLE.API_KEY,
    scopes: CONFIG.GOOGLE.SHEETS_SCOPES,
  });

  return google.sheets({
    version: "v4",
    auth,
  });
}
