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


## Backlog
[X] Set the short enders when updating WBs
[X] New group algorithm
[X] Groups on KT interrupts are broken
[X] Remove Faerlina Assignments
[X] Add short end based assignments to Maexxna
[X] Sapphiron
[X] Maexxna Cocoon Assignment
[X] Gluth Assignment
[X] Extra bonus "short-end" points if assigned to a not great task (Sapphiron, Maexxna)
[ ] Gothik (undead, living setup)
[ ] Thaddius (left = 1,3,5; right = 2,4,6)
