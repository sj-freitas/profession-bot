import { GroupPreConfig } from "../../buff-management/find-next-assignment";
import { WorldBuffInfo } from "../../sheets/get-buffers";
import { Player } from "../../sheets/get-players";

function incrementLetter(letter: string, incrementValue: number = 1): string {
  return (
    letter.substring(0, letter.length - 1) +
    String.fromCharCode(letter.charCodeAt(letter.length - 1) + incrementValue)
  );
}

function capitalizeFirstLetter(word: string): string {
  const [firstLetter, ...remainingChars] = word;

  return `${firstLetter.toLocaleUpperCase()}${remainingChars.join("")}`;
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
        [groupId]: getArrayFromSingleOrArray<Player | null>(assignees).map(
          (t) => (t !== null ? t.discordHandle : "<MISSING_ASSIGNMENT>"),
        ),
      };
    });
  });

  return `# World buff item rotation
${Object.entries(formatted)
  .map(
    ([buffName, groupInfo]) =>
      `- **${buffInfo.get(buffName)?.longName} (${capitalizeFirstLetter(buffInfo.get(buffName)?.shortName ?? "")})**: ${Object.entries(
        groupInfo,
      )
        .map(
          ([groupId, handles]) =>
            `${groupId}: ${handles.length === 1 ? `${handles[0]}` : `${handles.map((t, index) => `${index+1}: ${t}`).join(" ; ")}` }`,
        )
        .join("  ")} `,
  )
  .join("\n")}
  `;
}
