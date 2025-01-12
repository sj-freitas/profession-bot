import { SheetClient } from "./config";
import { SheetTableConfig, TableWrapper } from "./table-wrapper";
import { toColumnValue, toEntityValue } from "./table-wrapper-utils";

function getCharactersFromCHars(text: string): {
  main: string;
  alts: string[];
} {
  const [main, ...alts] = toEntityValue<string>(text);
  return { main, alts };
}

function toCharsColumn(mainChar: string, alts: string[]): string {
  return toColumnValue([mainChar, ...alts]);
}

/**
 * Represents a player in our discord server, a player can contain multiple characters.
 */
export interface PlayerInfo {
  /**
   * Global user discord id
   */
  discordId: string;
  /**
   * Discord handle for this specific user, this field is only used for the world buff part as it makes it more user friendly
   * but it's questionable if we want to keep it.
   */
  discordHandle: string;
  /**
   * Discord server handle for this specific user in this server, this field isn't really used here and it can be changed.
   * It should be deprecated.
   */
  discordServerHandle: string;
  /**
   * The first character in the list, the player's main.
   */
  mainName: string;
  /**
   * The other characters, can only be set if a main exists.
   */
  altNames: string[];
  /**
   * READONLY a flush of the user's roles on discord, it'll help officers map who should be entitled to what.
   */
  discordRoles: string[];
}

// Sheet table column names:
// Discord handle,Character Names,Server Handle,Discord ID,	Discord Role (Updated every 24 hours)
const config: SheetTableConfig<PlayerInfo> = {
  tableRange: "A2:E",
  idColumnName: "discordId",
  mapRawToEntity: ([
    discordHandle,
    allCharacterNames,
    discordServerHandle,
    discordId,
    discordRoles,
  ]) => ({
    discordHandle,
    discordId,
    discordServerHandle,
    mainName: getCharactersFromCHars(allCharacterNames).main,
    altNames: getCharactersFromCHars(allCharacterNames).alts,
    discordRoles: toEntityValue(discordRoles),
  }),
  mapEntityToRaw: ({
    discordHandle,
    discordId,
    discordServerHandle,
    mainName,
    altNames,
    discordRoles,
  }) => [
    discordHandle,
    toCharsColumn(mainName, altNames),
    discordServerHandle,
    discordId,
    toColumnValue(discordRoles),
  ],
};

export class PlayerInfoTable extends TableWrapper<PlayerInfo> {
  constructor(sheetClient: SheetClient, sheetId: string) {
    super(sheetClient, sheetId, "DiscordMapping", config);
  }
}