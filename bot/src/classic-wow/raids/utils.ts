import { Table, toTableMarkdown } from "../../exports/markdown";
import { Class } from "../../integrations/raider-io/types";
import { Character, Group, Raid } from "../raid-assignment";

export function pickOnePutOnTop<T>(array: T[], preselected?: T): T[] {
  const element =
    preselected ?? array[Math.floor(Math.random() * array.length)];

  return [element, ...array.filter((t) => t !== element)];
}

export function shuffleArray<T>(array: T[]): T[] {
  let originalArrayCopied = [...array];
  const newArray: T[] = [];
  for (let i = 0; i < array.length; i += 1) {
    const [randomElement, ...restOfTheArray] =
      pickOnePutOnTop(originalArrayCopied);

    originalArrayCopied = restOfTheArray;
    newArray.push(randomElement);
  }

  return newArray;
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

export function removeFirstOnPredicate<T>(
  array: T[],
  predicate: (t: T) => boolean,
): T | null {
  for (let i = 0; i < array.length; i += 1) {
    if (predicate(array[i])) {
      const element = array.splice(i, 1)[0];

      return element;
    }
  }

  return null;
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
  return `## Overall composition for Raidsort AddOn
Do \`/raidsort import\` in-game to open the AddOn and copy the following value:
\`\`\`
${exportToLuaTable(assignments)}
\`\`\`

Once the setup is loaded you can \`/raidsort load\` to sort groups or \`/raidsort invite\` to invite members into the raid.`;
}

function toTable(groups: Group[], startId: number): Table {
  const table: Table = {
    columns: groups.map((t, index) => ({
      header: `Group ${startId + index + 1}`,
      values: t.slots
        .map((x) => x?.name)
        .filter((x): x is string => Boolean(x)),
    })),
  };

  return table;
}

export function exportRaidGroupsToTable(
  { groups }: Raid,
  numberOfGroupsPerLine = 3,
) {
  const maxNumberOfTablesPerLine = Math.ceil(
    groups.length / numberOfGroupsPerLine,
  );

  const markedGroups = groups.map(
    (t) =>
      ({
        slots: t.slots
          .map((s) => ({
            ...s,
            name: s?.role === "Tank" ? `${s.name} [T]` : s?.name,
          }))
          .map((s) => ({
            ...s,
            name: s?.role === "Healer" ? `${s.name} [H]` : s?.name,
          })),
      }) as Group,
  );

  const maxWidthOverride = Math.max(
    ...markedGroups.flatMap((t) => t.slots).map((t) => t?.name?.length ?? 0),
  );
  const tables: Table[] = [];
  for (let i = 0; i < maxNumberOfTablesPerLine; i += 1) {
    const currLine = markedGroups.slice(
      i * numberOfGroupsPerLine,
      i * numberOfGroupsPerLine + numberOfGroupsPerLine,
    );

    tables.push(toTable(currLine, i * numberOfGroupsPerLine));
  }

  return `${tables.map((t) => `\n${toTableMarkdown(t, maxWidthOverride)}`).join("\n")}`;
}

export function sortByClasses(
  characters: Character[],
  classNames: Class[],
): Character[] {
  return characters.sort((a, b) => {
    for (const currClass of classNames) {
      if (b.class === currClass) {
        return +1;
      }
      if (a.class === currClass) {
        return -1;
      }
    }

    return 0;
  });
}
