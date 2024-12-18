import { WowHeadQueryResults } from "./types";

export function removeQAResults({
  results,
  ...rest
}: WowHeadQueryResults): WowHeadQueryResults {
  return {
    ...rest,
    results: results.filter((t) => !t.name.startsWith("QAEnchant")),
  };
}

export function removeNonSpells({
  results,
  ...rest
}: WowHeadQueryResults): WowHeadQueryResults {
  return {
    ...rest,
    results: results.filter((t) => t.type === 6),
  };
}
