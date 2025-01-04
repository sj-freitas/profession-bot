import fetch from "node-fetch";
import { CONFIG } from "../../config";
import { Faction, RaidConfig, RaidInstance, raidInstanceSchema } from "./types";

interface SimplifiedRaidConfig {
  allowDuplicate: boolean;
  amount: number;
  faction: Faction;
  instances: string[];
}

function mapToRaidConfigSchema(raidConfig: SimplifiedRaidConfig): RaidConfig {
  return {
    allowDuplicate: raidConfig.allowDuplicate,
    amount: raidConfig.amount,
    faction: raidConfig.faction,
    instances: raidConfig.instances,
    itemLimit: 0,
    characterNotes: true,
    discord: true,
    edition: "classic",
    hideReserves: false,
    plusModifier: 1,
    restrictByClass: true,
  };
}

export async function raidCreate(
  raidConfig: SimplifiedRaidConfig,
): Promise<RaidInstance> {
  const response = await fetch(
    `${CONFIG.SOFTRES_IT.API_HOST_NAME}/raid/create`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mapToRaidConfigSchema(raidConfig)),
    },
  );
  const json = await response.json();

  return raidInstanceSchema.parse(json);
}

export async function getRaid(raidId: string): Promise<RaidInstance> {
  const response = await fetch(
    `${CONFIG.SOFTRES_IT.API_HOST_NAME}/raid/${raidId}`,
  );
  const json = await response.json();

  return raidInstanceSchema.parse(json);
}
