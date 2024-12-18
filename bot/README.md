# proffession-bot
Aggregates data from a Google Sheet integrates with Wowhead and creates a nice wiki for discord

## Enviornment Variables

Create a .env file with the following env vars:
```sh
GOOGLE_API_KEY="{GOOGLE_API_KEY_TO_READ_SHEETS}"
DISCORD_PUBLIC_KEY="{DISCORD_APP_PUBLIC_KEY}"
```


## Run Modes

- Generate data: Parses the form sheet raw data, finds the equivalent recipes in wowhead and pivots the data
- Bot mode: Server that serves bot requests to find crafters for professions
