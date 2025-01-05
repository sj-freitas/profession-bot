import fetch from "node-fetch";
import { CONFIG } from "../../config";
import {
  eventSchema,
  RaidEvent,
  ServerEvents,
  serverEventsSchema,
} from "./types";

export async function fetchEvent(eventId: string): Promise<RaidEvent | null> {
  const response = await fetch(
    `${CONFIG.RAID_HELPER_API.HOST_NAME}/events/${eventId}`,
    {
      headers: {
        Authorization: CONFIG.RAID_HELPER_API.API_KEY,
      },
    },
  );
  try {
    const json = await response.json();

    return eventSchema.parse(json);
  } catch {
    return null;
  }
}

export async function fetchServerEvents(
  serverId: string,
): Promise<ServerEvents | null> {
  const response = await fetch(
    `${CONFIG.RAID_HELPER_API.HOST_NAME}/servers/${serverId}/events`,
    {
      headers: {
        Authorization: CONFIG.RAID_HELPER_API.API_KEY,
      },
    },
  );
  try {
    const json = await response.json();

    return serverEventsSchema.parse(json);
  } catch {
    return null;
  }
}
