import { SheetClient } from "./config";
import { appendRowToGoogleSheet, readGoogleSheet } from "./utils";

export interface PlayerStaffRequest {
  messageId: string;
  author: string;
  message: string;
}

export async function writeRequestInfo(
  sheetClient: SheetClient,
  sheetId: string,
  staffRequestInfo: PlayerStaffRequest,
): Promise<void> {
  const rows = await readGoogleSheet(
    sheetClient,
    sheetId,
    "Feedback and Suggestions",
    "A:C",
  );

  if (!rows) {
    throw new Error("Failed to read from sheets!");
  }

  const writeIndex = rows.length;

  await appendRowToGoogleSheet(
    sheetClient,
    sheetId,
    "Feedback and Suggestions",
    { x: "A", y: writeIndex },
    [
      staffRequestInfo.messageId,
      staffRequestInfo.author,
      staffRequestInfo.message,
    ],
  );
}

interface StaffRequestResponse {
  staffResponder: string;
  reply: string;
}

export async function respondToRequestInfo(
  sheetClient: SheetClient,
  sheetId: string,
  ticketId: string,
  staffRequestResponse: StaffRequestResponse,
): Promise<string> {
  const rows = await readGoogleSheet(
    sheetClient,
    sheetId,
    "Feedback and Suggestions",
    "A:B",
  );

  if (!rows) {
    throw new Error("Failed to read from sheets!");
  }

  const indexOfTicket = rows.findIndex((t) => t[0] === ticketId);

  if (indexOfTicket < 0) {
    throw new Error(`Issue ${ticketId} not found!`);
  }

  await appendRowToGoogleSheet(
    sheetClient,
    sheetId,
    "Feedback and Suggestions",
    { x: "D", y: indexOfTicket + 1 },
    [
      new Date().toString(),
      staffRequestResponse.staffResponder,
      staffRequestResponse.reply,
    ],
  );

  return `${rows[indexOfTicket][1]}`;
}