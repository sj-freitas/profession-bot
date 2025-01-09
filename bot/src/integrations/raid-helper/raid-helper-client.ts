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

export interface EventCreateParams {
  leaderId: string;
  templateId: 37;
  /**
   * Date "2025-01-12"
   */
  date: string;
  /**
   *  Time "20:00"
   */
  time: string;
  title: string;
  description: string;
}

export async function createEvent(
  serverId: string,
  channelId: string,
  event: EventCreateParams,
): Promise<RaidEvent | null> {
  const response = await fetch(
    `${CONFIG.RAID_HELPER_API.HOST_NAME}/servers/${serverId}/channels/${channelId}/event`,
    {
      method: "POST",
      headers: {
        Authorization: CONFIG.RAID_HELPER_API.API_KEY,
      },
      body: JSON.stringify(event),
    },
  );
  try {
    const json = await response.json();

    return eventSchema.parse(json);
  } catch {
    return null;
  }
}
