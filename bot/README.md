# proffession-bot

Aggregates data from a Google Sheet integrates with Wowhead and creates a nice wiki for discord

## Enviornment Variables

Create a .env file with the following env vars:

```sh
GUILD_INFO_SHEET="{GOOGLE_SHEET_PROFESSION_INFO_ID_MUST_BE_PUBLIC}"
GOOGLE_API_KEY="{GOOGLE_API_KEY_TO_READ_SHEETS}"
DISCORD_PUBLIC_KEY="{DISCORD_APP_PUBLIC_KEY}"
DISCORD_BOT_TOKEN="{DISCORD_BOT_TOKEN}"
DISCORD_APPLICATION_ID="{DISCORD_DOT_APPLICATION_OR_CLIENT_ID}"
```

## Run Modes

- Generate data: Parses the form sheet raw data, finds the equivalent recipes in wowhead and pivots the data
- Bot mode: Server that serves bot requests to find crafters for professions

# Missing features
- More accurate word matching (tolerant to typos) [HARD]
- Support item IDs directly
- Raid assignments merge groups with free slots [DONE]
- Sartura bug fix
- Twin emps assignment
- guild feedback bot [Start]
