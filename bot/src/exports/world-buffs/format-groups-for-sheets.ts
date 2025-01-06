import { GroupPreConfig } from "../../buff-management/find-next-assignment";
import { WorldBuffAssignments } from "../../integrations/sheets/get-buffers";
import { Player } from "../../integrations/sheets/get-players";

function incrementLetter(letter: string, incrementValue: number = 1): string {
  return (
    letter.substring(0, letter.length - 1) +
    String.fromCharCode(letter.charCodeAt(letter.length - 1) + incrementValue)
  );
}

function getArrayFromSingleOrArray<T>(entry: T | T[]): T[] {
  if (Array.isArray(entry)) {
    return entry;
  }

  return [entry];
}

export function formatGroupsForSheets(
  groupsConfig: GroupPreConfig[],
  worldBuffConfig: WorldBuffAssignments[],
  dateString = "[DATE]",
): string {
  return groupsConfig
    .map((group, index) => {
      const groupName = `ASSIGNMENTS ${dateString} ${incrementLetter("A", index)}`;

      const inOrder = worldBuffConfig.map((currBuff) =>
        getArrayFromSingleOrArray(
          group[currBuff.buffInfo.shortName as keyof GroupPreConfig],
        )
          .filter((t): t is Player => t !== null)
          .map((t) => t.discordHandle)
          .join(";"),
      );

      return `${groupName}
${inOrder.join("\n")}
    `;
    })
    .join("\n\n");
}
