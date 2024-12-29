import { Character, Raid } from "../raid-assignment";

export function pickOnePutOnTop<T>(array: T[], preselected?: T): T[] {
  const element =
    preselected ?? array[Math.floor(Math.random() * array.length)];

  return [element, ...array.filter((t) => t !== element)];
}

export function pickOneAtRandomAndRemoveFromArray<T>(
  array: T[],
  random: () => number = Math.random,
): T | null {
  if (array.length === 0) {
    return null;
  }

  const indexOfElementToRemove = Math.floor(random() * array.length);

  return array.splice(indexOfElementToRemove, 1)[0];
}

export function exportToLuaTable(composition: Raid): string {
  return `{\n${composition.groups
    .map(
      (currGroup) =>
        `    {${currGroup.slots
          .filter((t): t is Character => Boolean(t))
          .map((t) => `"${t.name}"`)
          .join(",")}}`,
    )
    .join(",\n")}
}`;
}

export function getRaidsortLuaAssignment(assignments: Raid) {
  return `
## Copy the following assignments to their specific use cases

### WoW Raidsort Addon, do \`/raidsort import\` and copy the following value:
\`\`\`
${exportToLuaTable(assignments)}
\`\`\`
  `;
}
