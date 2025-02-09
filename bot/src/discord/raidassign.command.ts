/* eslint-disable no-console */
import { Database } from "../exports/mem-database";
import { getCthunAssignment } from "../classic-wow/raids/temple-of-aq/cthun";
import { getSarturaAssignment } from "../classic-wow/raids/temple-of-aq/sartura";
import { CommandHandler } from "./commandHandler";
import { getGenericRaidAssignment } from "../classic-wow/raids/generic";
import {
  getRosterFromRaidEvent,
  toRaidAssignmentRoster,
} from "../flows/roster-helper";
import { fetchEvent } from "../integrations/raid-helper/raid-helper-client";
import { RaidAssignmentRoster } from "../classic-wow/raids/raid-assignment-roster";
import { RaidAssignmentResult } from "../classic-wow/raids/assignment-config";
import { getTwinsAssignment } from "../classic-wow/raids/temple-of-aq/twin-emps";
import { getBugTrioAssignment } from "../classic-wow/raids/temple-of-aq/bug-trio";
import { getKelThuzadAssignment } from "../classic-wow/raids/naxxramas/kel-thuzad";
import { getMaexxnaAssignment } from "../classic-wow/raids/naxxramas/maexxna";
import { getPatchwerkAssignment } from "../classic-wow/raids/naxxramas/patchwerk";

type RaidAssignment = (
  roster: RaidAssignmentRoster,
) => Promise<RaidAssignmentResult>;

export const ENCOUNTER_HANDLERS: { [key: string]: RaidAssignment } = {
  raid: getGenericRaidAssignment,
  "aq-sartura": getSarturaAssignment,
  "aq-twins": getTwinsAssignment,
  "aq-cthun": getCthunAssignment,
  "aq-bug-trio": getBugTrioAssignment,
  "naxx-kelthuzad": getKelThuzadAssignment,
  "naxx-maexxna": getMaexxnaAssignment,
  "naxx-patchwerk": getPatchwerkAssignment,
};

export const SUPPORTED_ENCOUNTERS = Object.keys(ENCOUNTER_HANDLERS);

export const raidAssignHandler: CommandHandler<Database> = async ({
  options,
  payload: database,
  reply,
  interaction,
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

  const { user } = interaction;

  // Send a first message to trigger the DM, then edit it and send the rest.
  const firstMessage = await user.send({ content: "Loading..." });
  await reply(
    `Click [here](${firstMessage.url}) to see the generated assignments`,
  );

  const roster = await getRosterFromRaidEvent(event, database);
  const raidAssignmentRoster = toRaidAssignmentRoster(roster);
  const assignments = await getAssignmentForEncounter(raidAssignmentRoster);

  await Promise.all(
    assignments.dmAssignment.map(async (t, idx) => {
      if (idx === 0) {
        await firstMessage.edit(t);
      } else {
        await user.send(t);
      }
    }),
  );
  await user.send({
    content: "Attachments:",
    files: assignments.files,
  });
};
