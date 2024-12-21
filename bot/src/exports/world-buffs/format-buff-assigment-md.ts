import { WorldBuffAssignments } from "../../sheets/get-buffers";

function capitalizeFirstLetter(word: string): string {
  const [firstLetter, ...remainingChars] = word;

  return `${firstLetter.toLocaleUpperCase()}${remainingChars.join("")}`;
}

export function formatBuffAssignmentMarkdown(
  worldBuffAssignments: WorldBuffAssignments[],
): string {
  return worldBuffAssignments
    .map(
      (assignment) =>
        `- **${assignment.buffInfo.longName} (${capitalizeFirstLetter(assignment.buffInfo.shortName)})**: ${assignment.discordHandles.join(" ")} `,
    )
    .join("\n");
}
