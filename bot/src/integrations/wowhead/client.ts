import fetch from "node-fetch";
import { WowHeadQueryResults } from "./types";
import { CONFIG } from "../../config";

export async function queryWowHead(
  searchTerm: string,
): Promise<WowHeadQueryResults> {
  const BASE_URL = `${CONFIG.WOW_HEAD.HOST_NAME}/classic/search/suggestions-template`;
  const queryString = `?q=${encodeURIComponent(searchTerm.toLowerCase())}`;

  const results = await fetch(`${BASE_URL}${queryString}`);

  const parsed = (await results.json()) as WowHeadQueryResults;

  if (parsed === null) {
    return {
      search: searchTerm,
      results: [],
    };
  }

  return parsed;
}
