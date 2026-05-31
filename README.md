# ArkAscendedQuestApiV2

## Usage Guide

This README is only for running the released software.

## Download

1. Go to the repository Releases page.
2. Download the latest release archive.
3. Extract it to a folder on your server or PC.

## Requirements

- Node.js 20+
- Access to your MariaDB/MySQL database

## First-Time Setup

1. Open the extracted folder.
2. Copy `example.config.json` to `config.json`.
3. Edit `config.json`:

- Set database host, name, user, password, and port.
- Set `servicePort` to the API port you want to run on.
- Adjust optional settings like `trackedNameOverrides`, `leaderboardTrackers`, and `CustomStatistics` if needed.

## Start the API

Option A (Windows, easiest):

```bash
start.bat
```

Option B (manual):

```bash
node src/index.js
```

If database connection fails, the API will print the error and stop instead of listening on the port.

## Endpoints

GET requests
- `/{eos_id}/currentquests`
- `/{eos_id}/completed`
- `/{eos_id}/leaderboards`
- `/{eos_id}/statistics`
- `/{eos_id}/trackers`
- `/{eos_id}/quest/{quest_id}`
- `/content/{file}`

POST requests
- `/{eos_id}/discordlink`

## Notes

- `config.json` contains secrets and should not be shared publicly.
- Static files served by `/content/{file}` are read from `content` directory.
