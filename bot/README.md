# Profession Bot

Aggregates data from a Google Sheet integrates with Wowhead and creates a nice wiki for discord
It does also a lot more raid stuff, very much tailored to our guild Relic Hunters and Season of Discovery but there's
a chance that it can be expanded to other guilds, maybe not other versions of wow.

## Environment Variables

Create a .env file with the following env vars:

```sh
GUILD_NAME="Relic Hunters"
GUILD_REGION="eu"
GUILD_REALM="Wild Growth"
GUILD_INFO_SHEET="{GOOGLE_SHEET_PROFESSION_INFO_ID_MUST_BE_PUBLIC}"
GUILD_STAFF_REQUEST_CHANNEL_ID="{DISCORD_SNOWFLAKE}"
GUILD_STAFF_RAID_CHANNEL_ID="{DISCORD_SNOWFLAKE}"
GUILD_DISCORD_RAID_SIGN_UP_CHANNELS='{ARRAY OF DISCORD SNOW FLAKES}'
GUILD_DISCORD_SERVER_ID="{DISCORD_SNOWFLAKE}"
GUILD_RAIDER_ROLES='{ARRAY OF DISCORD SNOW FLAKES}'
GOOGLE_CREDENTIALS='{GOOGLE JSON CREDENTIALS}'
DISCORD_PUBLIC_KEY="{DISCORD_APP_PUBLIC_KEY}"
DISCORD_BOT_TOKEN="{DISCORD_BOT_TOKEN}"
DISCORD_APPLICATION_ID="{DISCORD_DOT_APPLICATION_OR_CLIENT_ID}"
RAID_HELPER_API_KEY="{RAIDER_HELPER_API_KEY_CAN_BE_OBTAINED_WITH_COMMAND_ON_DISC_SERVER}"
```

# Missing features

## Profession Features

- More accurate word matching (tolerant to typos) [HARD]
- Support item IDs directly [MEDIUM]

# Raid Assignment Features

- Flows:
  - Make 2 flows:
    - A: At 15 mins after raid start time we store the World Buff History. We check if the current history is already stored and if it is, we don't store anymore.
    - B: /nuke (?) delete everything or run it automatically at 22 ST

Keeping this snippet here so I don't forget
```ts
// World Buff History Maker
function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "CET",
    hour12: false,
  };

  const formatter = new Intl.DateTimeFormat("de-DE", options);
  return formatter.format(date).replace(/,/g, "");
}

const eventDateFormatted = formatDate(new Date(raidEvent.startTime * 1000));
const officerChatMessageTag = `ASSIGNMENTS ${eventDateFormatted}`; // A,B
const formattedForSheets = formatGroupsForSheets(
  assignment,
  rawAssignmentConfig,
  eventDateFormatted,
);
```
