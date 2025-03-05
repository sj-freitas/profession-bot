import { GroupPreConfig } from "../../buff-management/find-next-assignment";
import { CONFIG } from "../../config";
import { RaidEvent } from "../../integrations/raid-helper/types";
import { WorldBuffInfo } from "../../integrations/sheets/get-buffers";
import { PlayerInfo } from "../../integrations/sheets/player-info-table";

const { DISCORD_SERVER_ID } = CONFIG.GUILD;

function incrementLetter(letter: string, incrementValue: number = 1): string {
  return (
    letter.substring(0, letter.length - 1) +
    String.fromCharCode(letter.charCodeAt(letter.length - 1) + incrementValue)
  );
}

function capitalizeFirstLetter(word: string): string {
  const [firstLetter, ...remainingChars] = word;

  return `${firstLetter.toUpperCase()}${remainingChars.join("")}`;
}

function getArrayFromSingleOrArray<T>(entry: T | T[]): T[] {
  if (Array.isArray(entry)) {
    return entry;
  }

  return [entry];
}

interface FormattedAssignmentBuffData {
  [buffName: string]: {
    [groupId: string]: string[];
  };
}

const MISSING_DEFAULT = "missing!";

// TODO Fix this to consider alts for that raid. This might take a bit more work.
export function formatGroupAssignmentsToStaffRaidWarning(
  groupConfig: GroupPreConfig[],
  buffInfo: Map<string, WorldBuffInfo>,
  raidEvent: RaidEvent,
): [tag: string, message: string] {
  const tag = `### [World Buff Assignments](https://discord.com/channels/${DISCORD_SERVER_ID}/${raidEvent.channelId}/${raidEvent.id})`;

  return [
    tag,
    `${tag}
These are the assignments converted as raid warnings to be easily posted instead of being called orally. Ideally these could be automated into an addon.
** Group A **
\`/rw ${Object.entries(groupConfig[0])
      .map(
        ([buff, players]) =>
          `${buffInfo.get(buff)?.shortName}=${((Array.isArray(players) ? players[0] : players) as PlayerInfo)?.mainName ?? MISSING_DEFAULT}`,
      )
      .join(" | ")}\`
** Group A2 **
\`/rw ${Object.entries(groupConfig[0])
      .filter(
        ([buff, players]) =>
          buffInfo.get(buff)?.duration === 1 && players?.length > 1,
      )
      .map(
        ([buff, players]) =>
          `${buffInfo.get(buff)?.shortName}=${(players?.[1] as PlayerInfo)?.mainName ?? MISSING_DEFAULT}`,
      )
      .join(" | ")}\`
** Group B **
\`/rw ${Object.entries(groupConfig[1])
      .map(
        ([buff, players]) =>
          `${buffInfo.get(buff)?.shortName}=${((Array.isArray(players) ? players[0] : players) as PlayerInfo)?.mainName ?? MISSING_DEFAULT}`,
      )
      .join(" | ")}\`
** Group B2 **
\`/rw ${Object.entries(groupConfig[1])
      .filter(
        ([buff, players]) =>
          buffInfo.get(buff)?.duration === 1 && players?.length > 1,
      )
      .map(
        ([buff, players]) =>
          `${buffInfo.get(buff)?.shortName}=${(players[1] as PlayerInfo)?.mainName ?? MISSING_DEFAULT}`,
      )
      .join(" | ")}\`
  `,
  ];
}

export function formatGroupAssignmentsToMarkdown(
  groupConfig: GroupPreConfig[],
  buffInfo: Map<string, WorldBuffInfo>,
): string {
  const START_LETTER = "A";
  const formatted: FormattedAssignmentBuffData = {};

  groupConfig.forEach((currGroup, index) => {
    const groupId = incrementLetter(START_LETTER, index);

    Object.entries(currGroup).forEach(([buffName, assignees]) => {
      const currBuffInfo = buffInfo.get(buffName);

      if (!currBuffInfo) {
        throw new Error(`Unexpected unknown buff ${buffName}!`);
      }

      formatted[currBuffInfo.shortName] = {
        ...formatted[currBuffInfo.shortName],
        [groupId]: getArrayFromSingleOrArray<PlayerInfo | null>(assignees).map(
          (t) =>
            t !== null
              ? `<@${t.discordId ?? t.discordHandle}>`
              : "<MISSING_ASSIGNMENT>",
        ),
      };
    });
  });

  const message = `## World buff item rotation
${Object.entries(formatted)
  .map(
    ([buffName, groupInfo]) =>
      `- **${buffInfo.get(buffName)?.longName} (${capitalizeFirstLetter(buffInfo.get(buffName)?.shortName ?? "")})**: ${Object.entries(
        groupInfo,
      )
        .map(
          ([groupId, handles]) =>
            `${groupId}: ${handles.length === 1 ? `${handles[0]}` : `${handles.map((t, index) => `${index + 1}: ${t}`).join(" ; ")}`}`,
        )
        .join("  ")} `,
  )
  .join("\n")}

Please DM an officer if you cannot provide at least 3 items in the raid.`;

  if (message.indexOf("<MISSING_ASSIGNMENT>") >= 0) {
    return `${message}
There are missing assignments, please feel free to volunteer!`;
  }

  return message;
}
