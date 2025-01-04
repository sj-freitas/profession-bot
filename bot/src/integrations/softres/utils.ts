import { CONFIG } from "../../config";

export function getSoftresLink(raidId: string) {
  return `${CONFIG.SOFTRES_IT.HOST_NAME}/raid/${raidId}`;
}
