# How to test the addons?

Copy the files to your WoW DIR, mine is:

cp -R "./Raidsort" "/Users/sfreitas/Applications/World of Warcraft/_classic_era_/Interface/AddOns"

## Raidsort

A World of Warcraft addon that allows you to copy a LUA table and use it as raid setup.
This makes group sorting and invite process incredibly trivial since it's not up to you to make these decisions unless you want to.

## Backlog

- Add presets (import to an ID) `/raidsort import cthun` & `/raidsort load cthun` [EASY]
- Support Marks, Assist and MainTanks in the LUA table [MEDIUM] - requires some duck typing `{ "Darkshivan", { name: "Tearyn", assist: true, mainTank: false }, "C", ... }`

### Compile and post

zip -vr Raidsort.zip ./Raidsort/ -x "*.DS_Store"
