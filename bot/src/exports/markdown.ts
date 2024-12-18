import { AvailableProfession, GuildProfessionData } from "./types";

// TODO Add user discord map

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
