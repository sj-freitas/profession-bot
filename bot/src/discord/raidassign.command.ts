/* eslint-disable no-console */
import { Database } from "../exports/mem-database";
import { Player } from "../integrations/sheets/get-players";
import { Character } from "../classic-wow/raid-assignment";
import { getCthunAssignment } from "../classic-wow/raids/temple-of-aq/cthun";
import { getSarturaAssignment } from "../classic-wow/raids/temple-of-aq/sartura";
import { CommandHandler } from "./commandHandler";
import { getGenericRaidAssignment } from "../classic-wow/raids/generic";
import { getRosterFromRaidEvent } from "../flows/roster-helper";
import { fetchEvent } from "../integrations/raid-helper/raid-helper-client";

type RaidAssignment = (roster: Character[], players: Player[]) => string;

export const ENCOUNTER_HANDLERS: { [key: string]: RaidAssignment } = {
  raid: getGenericRaidAssignment,
  "aq-sartura": getSarturaAssignment,
  "aq-cthun": getCthunAssignment,
};

export const SUPPORTED_ENCOUNTERS = Object.keys(ENCOUNTER_HANDLERS);

export const raidAssignHandler: CommandHandler<Database> = async ({
  options,
  payload: database,
  reply,
}): Promise<void> => {
  const encounter = options.getString("encounter");
  if (encounter === null) {
    await reply("Failed to provide a value for encounter.");
    return;
  }

  const getAssignmentForEncounter = ENCOUNTER_HANDLERS[encounter];
  if (!getAssignmentForEncounter) {
    await reply(
      `Encounter ${encounter} isn't supported, supported encounters are: ${SUPPORTED_ENCOUNTERS.join(" | ")}`,
    );
    return;
  }

  const eventId = options.getString("event-id");
  if (eventId === null) {
    await reply("Failed to provide a valid roster.");
    return;
  }

  const event = await fetchEvent(eventId);
  if (!event) {
    await reply(`${eventId} refers to an invalid event.`);
    return;
  }
  const roster = await getRosterFromRaidEvent(event, database);
  const allPlayers = roster.characters.map((t) => t.player).flatMap((t) => t);
  const assignments = getAssignmentForEncounter(
    roster.characters.map((t) => ({
      name: t.name,
      class: t.class,
      role: t.role,
    })),
    allPlayers,
  );

  await reply(assignments);
};
