import { AvailableProfession, GuildProfessionData } from "./types";

export function getCrafters(crafters: string[]): string {
  const listOfCrafters = crafters
    .map((currCrafter) => `${currCrafter}`)
    .join(", ");

  return listOfCrafters;
}

export function toMarkdown(
  data: Map<AvailableProfession, GuildProfessionData>,
): string {
  return `
# Profession Data
This list is automatically updated, please add new submissions [here](https://docs.google.com/forms/d/e/1FAIpQLScb17YhYQOCUbBvTwO0CaYqvG145BkxOFdP2_uSvEhtGwg89Q/viewform?usp=dialog)

${[...data.entries()]
  .map(
    ([profession, { recipes }]) => `## ${profession}
${recipes
  .map(
    (currRecipe) =>
      `- [${currRecipe.name}](${currRecipe.url}): Crafters: [${getCrafters(currRecipe.crafters)}]`,
  )
  .join("\n")}
`,
  )
  .join("\n")} 
`;
}

export interface Table {
  columns: {
    header: string;
    values: string[];
  }[];
}

type ValueMetadata = {
  value: string;
  width: number;
};

type RowMetadata = ValueMetadata[];

function addPadding(value: string, amount: number, character = " "): string {
  if (value.length >= amount) {
    return value;
  }

  return [
    ...value,
    ...new Array(Math.min(amount - value.length)).fill(character),
  ].join("");
}

function printRow(row: RowMetadata): string {
  return `|${row.map(({ value, width }) => ` ${addPadding(value, width, " ")} `).join("|")}|`;
}

function printEmptyLine(row: RowMetadata) {
  return `|${row.map((t) => `${new Array(t.width + 2).fill("-").join("")}`).join("|")}|`;
}

/**
 *
 * | HEADER 1 | HEADER 2 |
 * |----------|----------|
 * | value 1  | value 2  |
 * | value 3  | value 4  |
 */

export function toTableMarkdown(table: Table, maxWidthOverride?: number) {
  const columnMetadata = table.columns.map((currColumn) => ({
    ...currColumn,
    width:
      maxWidthOverride ??
      currColumn.values.reduce((currMax, next) => {
        if (next.length > currMax) {
          return next.length;
        }
        return currMax;
      }, currColumn.header.length),
  }));
  const numberOfRows = columnMetadata.reduce((currMax, next) => {
    if (next.values.length > currMax) {
      return next.values.length;
    }
    return currMax;
  }, -1);
  const headerRow = columnMetadata
    .map((t) => ({ value: t.header, width: t.width }))
    .flatMap((t) => t);
  const getRowMetadata = (rowId: number) => {
    const rowMetadata: RowMetadata = [];
    for (let i = 0; i < columnMetadata.length; i += 1) {
      const currColumn = columnMetadata[i];
      const currValue = columnMetadata[i].values[rowId] ?? "";

      rowMetadata.push({
        value: currValue,
        width: currColumn.width,
      });
    }
    return rowMetadata;
  };
  const rowArray = new Array(numberOfRows)
    .fill("")
    .map((_, index) => getRowMetadata(index));

  return `${printRow(headerRow)}
${printEmptyLine(headerRow)}
${rowArray.map((t) => printRow(t)).join("\n")}`;
}
